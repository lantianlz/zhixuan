# -*- coding: utf-8 -*-

import datetime
import time
from django.db import transaction
from django.utils.encoding import smart_unicode
from django.conf import settings

from common import utils, debug, validators, cache
from www.account.models import User, Profile, ExternalToken


dict_err = {
    100: u'邮箱重复',
    101: u'昵称重复',
    102: u'手机号重复',
    103: u'被逮到了，无效的性别值',
    104: u'这么奇葩的生日怎么可能',
    105: u'两次输入密码不相同',
    106: u'当前密码错误',
    107: u'新密码和老密码不能相同',
    108: u'登陆密码验证失败',
    109: u'新邮箱和老邮箱不能相同',
    110: u'邮箱验证码错误或者已过期，请重新验证',

    998: u'参数缺失',
    999: u'系统错误',
    000: u'成功'
}
ACCOUNT_DB = settings.ACCOUNT_DB


class UserBase(object):

    def __init__(self):
        from common import password_hashers
        self.hasher = password_hashers.MD5PasswordHasher()

    def set_password(self, raw_password):
        assert raw_password
        self.password = self.hasher.make_password(raw_password)
        return self.password

    def check_password(self, raw_password, password):
        return self.hasher.check_password(raw_password, getattr(self, 'password', password))

    def set_profile_login_att(self, profile, user):
        for key in ['email', 'mobilenumber', 'username', 'last_login', 'password']:
            setattr(profile, key, getattr(user, key))

    def get_user_login_by_id(self, id):
        try:
            user = User.objects.get(id=id)
            return user
        except User.DoesNotExist:
            return None

    def get_user_by_id(self, id):
        try:
            profile = Profile.objects.get(id=id)
            user = User.objects.get(id=profile.id)
            self.set_profile_login_att(profile, user)
            return profile
        except (Profile.DoesNotExist, User.DoesNotExist):
            return None

    def get_user_by_nick(self, nick):
        try:
            profile = Profile.objects.get(nick=nick)
            user = User.objects.get(id=profile.id)
            self.set_profile_login_att(profile, user)
            return profile
        except (Profile.DoesNotExist, User.DoesNotExist):
            return None

    def get_user_by_email(self, email):
        try:
            user = User.objects.get(email=email)
            profile = Profile.objects.get(id=user.id)
            self.set_profile_login_att(profile, user)
            return profile
        except (Profile.DoesNotExist, User.DoesNotExist):
            return None

    def get_user_by_mobilenumber(self, mobilenumber):
        try:
            if mobilenumber:
                user = User.objects.get(mobilenumber=mobilenumber)
                profile = Profile.objects.get(id=user.id)
                self.set_profile_login_att(profile, user)
                return profile
        except (Profile.DoesNotExist, User.DoesNotExist):
            return None

    def check_user_info(self, email, nick, password, mobilenumber):
        try:
            validators.vemail(email)
            validators.vnick(nick)
            validators.vpassword(password)
        except Exception, e:
            return False, smart_unicode(e)

        if self.get_user_by_email(email):
            return False, dict_err.get(100)
        if self.get_user_by_nick(nick):
            return False, dict_err.get(101)
        if self.get_user_by_mobilenumber(mobilenumber):
            return False, dict_err.get(102)
        return True, dict_err.get(000)

    def check_gender(self, gender):
        if not str(gender) in ('0', '1', '2'):
            return False, dict_err.get(103)
        return True, dict_err.get(000)

    def check_birthday(self, birthday):
        try:
            birthday = datetime.datetime.strptime(birthday, '%Y-%m-%d')
            now = datetime.datetime.now()
            assert (now + datetime.timedelta(days=100 * 365)) > birthday > (now - datetime.timedelta(days=100 * 365))
        except:
            return False, dict_err.get(104)
        return True, dict_err.get(000)

    @transaction.commit_manually(using=ACCOUNT_DB)
    def regist_user(self, email, nick, password, ip, mobilenumber=None, username=None, source=0, gender=0):
        '''
        @note: 注册
        '''
        try:
            if not (email and nick and password):
                transaction.rollback(using=ACCOUNT_DB)
                return False, dict_err.get(998)

            flag, result = self.check_user_info(email, nick, password, mobilenumber)
            if not flag:
                transaction.rollback(using=ACCOUNT_DB)
                return flag, result

            id = utils.uuid_without_dash()
            now = datetime.datetime.now()

            user = User.objects.create(id=id, email=email, mobilenumber=mobilenumber, last_login=now,
                                       password=self.set_password(password)
                                       )
            profile = Profile.objects.create(id=id, nick=nick, ip=ip, source=source, gender=gender)
            transaction.commit(using=ACCOUNT_DB)

            # 发送验证邮件和通知邮件
            # 其他触发事件
            self.set_profile_login_att(profile, user)
            return True, profile
        except Exception, e:
            debug.get_debug_detail(e)
            transaction.rollback(using=ACCOUNT_DB)
            return False, dict_err.get(999)

    def get_user_by_external_info(self, source, access_token, external_user_id,
                                  refresh_token, nick, ip, expire_time,
                                  user_url='', gender=0):
        assert all((source, access_token, external_user_id, refresh_token, nick))
        et = self.get_external_user(source, access_token, external_user_id, refresh_token)
        if et:
            return True, self.get_user_by_id(et.user_id)
        else:
            email = '%s@mrzhixuan.com' % (int(time.time() * 1000), )
            nick = self.generate_nick_by_external_nick(nick)
            if not nick:
                return False, u'生成名称异常'
            expire_time = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(int(time.time()) + int(expire_time)))
            flag, result = self.regist_user(email=email, nick=nick, password=email, ip=ip, source=1, gender=gender)
            if flag:
                user = result
                ExternalToken.objects.create(source=source, external_user_id=external_user_id,
                                             access_token=access_token, refresh_token=refresh_token, user_url=user_url,
                                             nick=nick, user_id=user.id, expire_time=expire_time
                                             )
                return True, user
            else:
                return False, result

    def generate_nick_by_external_nick(self, nick):
        if not self.get_user_by_nick(nick):
            return nick
        else:
            for i in xrange(3):
                new_nick = '%s_%s' % (nick, i)
                if not self.get_user_by_nick(new_nick):
                    return new_nick
            for i in xrange(10):
                return '%s_%s' % (nick,  str(int(time.time() * 1000))[-3:])

    def get_external_user(self, source, access_token, external_user_id, refresh_token):
        assert all((source, access_token, external_user_id))

        et = None
        ets = list(ExternalToken.objects.filter(source=source, external_user_id=external_user_id))
        if ets:
            et = ets[0]
            if et.access_token != access_token:
                et.access_token = access_token
                et.refresh_token = refresh_token
                et.save()
        else:
            ets = list(ExternalToken.objects.filter(source=source, access_token=access_token))
            if ets:
                et = ets[0]
                if et.external_user_id != external_user_id:
                    et.external_user_id = external_user_id
                    et.refresh_token = refresh_token
                    et.save()
        return et

    def change_profile(self, user, nick, gender, birthday):
        '''
        @note: 资料修改
        '''
        user_id = user.id
        if not (user_id and nick and gender and birthday):
            return False, dict_err.get(998)

        try:
            validators.vnick(nick)
        except Exception, e:
            return False, smart_unicode(e)

        if user.nick != nick and self.get_user_by_nick(nick):
            return False, dict_err.get(101)

        flag, result = self.check_gender(gender)
        if not flag:
            return flag, result

        flag, result = self.check_birthday(birthday)
        if not flag:
            return flag, result

        user = self.get_user_by_id(user_id)
        user.nick = nick
        user.gender = int(gender)
        user.birthday = birthday
        user.save()

        # todo:触发事件，比如清除缓存等
        return True, user

    def change_pwd(self, user, old_password, new_password_1, new_password_2):
        '''
        @note: 密码修改
        '''
        if not all((old_password, new_password_1, new_password_2)):
            return False, dict_err.get(998)

        if new_password_1 != new_password_2:
            return False, dict_err.get(105)
        if not self.check_password(old_password, user.password):
            return False, dict_err.get(106)
        if old_password == new_password_1:
            return False, dict_err.get(107)
        try:
            validators.vpassword(new_password_1)
        except Exception, e:
            return False, smart_unicode(e)

        user_login = self.get_user_login_by_id(user.id)
        user_login.password = self.set_password(new_password_1)
        user_login.save()
        return True, dict_err.get(000)

    def change_email(self, user, email, password):
        '''
        @note: 邮箱修改
        '''
        if not all((email, password)):
            return False, dict_err.get(998)

        if not self.check_password(password, user.password):
            return False, dict_err.get(108)

        if user.email == email:
            return False, dict_err.get(109)

        try:
            validators.vemail(email)
        except Exception, e:
            return False, smart_unicode(e)

        if user.email != email and self.get_user_by_email(email):
            return False, dict_err.get(100)

        user_login = self.get_user_login_by_id(user.id)
        user_login.email = email
        user_login.save()

        # todo发送验证邮件
        return True, dict_err.get(000)

    def send_confirm_email(self, user):
        '''
        @note: 发送验证邮件
        '''
        cache_obj = cache.Cache()
        key = u'confirm_email_code_%s' % user.id
        code = cache_obj.get(key)
        if not code:
            code = utils.uuid_without_dash()
            cache_obj.set(key, code, time_out=1800)

        if not cache_obj.get_time_is_locked(key, 60):
            from www.tasks import async_send_email
            content = '''
            请点击链接进行验证，%s/account/user_settings/verify_email?code=%s
            如果无法点击，请复制到浏览器中
            ''' % (settings.MAIN_DOMAIN, code)
            async_send_email(user.email, u'智选网邮箱验证', content)

    def check_email_confim_code(self, user, code):
        '''
        @note: 确认邮箱
        '''
        if not code:
            return False, dict_err.get(998)

        cache_obj = cache.Cache()
        key = u'confirm_email_code_%s' % user.id
        cache_code = cache_obj.get(key)

        if cache_code != code:
            return False, dict_err.get(110)

        user.email_verified = True
        user.save()
        return True, user



    # 忘记密码
