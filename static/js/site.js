/*
    为字符串拓展format方法
    用例：
    String.format('{0}, {1}!', 'Hello', 'world');
*/
if (!String.format) {
    String.format = function(src){
        if (arguments.length == 0){
            return null;
           }

        var args = Array.prototype.slice.call(arguments, 1);
        return src.replace(/\{(\d+)\}/g, function(m, i){
            return args[i];
        });
    };
}


/*
  自动补零
*/
function addZero(data){
    var temp = data + '';
    if(temp.length === 0){
        return '00'
    } else if(temp.length === 1){
        return  '0' + temp;
    } else{
        return data;
    }
}


/*
    拓展Jquery方法 
*/
(function(){
    // 设置文本框光标位置
    $.fn.setSelection = function(selectionStart, selectionEnd) {
        if(this.length == 0){
            return this;
        }

        input = this[0];

        // IE
        if (input.createTextRange) {
            var range = input.createTextRange();
            range.collapse(true);
            range.moveEnd('character', selectionEnd);
            range.moveStart('character', selectionStart);
            range.select();
        } else if (input.setSelectionRange) {
            input.focus();
            input.setSelectionRange(selectionStart, selectionEnd);
        }

        return this;
    }

    // 设置文本框光标到最后
    $.fn.focusEnd = function() {
        return this.setSelection(this.val().length, this.val().length);
    }

    // 自定义checkbox
    $.fn.zxCheckbox = function(){

        this.find('input').live('change', function(){
            var parent = $(this).parent();
            
            parent.hasClass('checked') ? parent.removeClass('checked') : parent.addClass('checked');
        });

        return this;
    }

    // 自定义radio
    $.fn.zxRadio = function(){

        this.find('input').live('change', function(){
            
            $('input[name='+$(this).attr('name')+']').each(function(){
                var me = $(this), parent = me.parent();
                
                me.attr('checked') ? parent.addClass('checked') : parent.removeClass('checked');
            });
            
        });

        return this;
    }

    // 
    $.ZXMsg = {
        version: '1.0.0',
        author: 'stranger',
        description: '取代浏览器自带的消息框'
    };
    /*
        通用alert框
        用例:
        $.ZXMsg.alert('提示', '操作成功!');
        $.ZXMsg.alert('提示', '操作成功, 5秒后自动关闭!', 5000);
    */
    $.ZXMsg.alert = function(alertTitle, alertMsg, delayCloseSeconds){
        var alertHtml = [
            '<div class="modal fade" id="alert_modal" tabindex="-1" role="dialog">',
                '<div class="modal-dialog w400">',
                    '<div class="modal-content">',
                        '<div class="modal-header pb-5">',
                            '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>',
                            '<h4 class="modal-title">'+alertTitle+'</h4>',
                        '</div>',
                        '<div class="modal-body">',
                            alertMsg,
                        '</div>',
                    '</div>',
                '</div>',
            '</div>'
        ].join('');

        // 将alert框添加进body
        $('body').append(alertHtml);
        
        // 关闭之后清除掉自己
        $('#alert_modal').on('hidden.bs.modal', function (e) {
            $(this).remove();
        });

        // 显示alert框
        $('#alert_modal').modal('show');

        // 是否设置了自动关闭
        if(delayCloseSeconds){
            window.setTimeout(function(){
                if($('#alert_modal').length > 0){
                    $('#alert_modal').modal('hide');
                }
                
            }, delayCloseSeconds)
        }
    }

    /*
        通用confirm框
        用例:
        $.ZXMsg.confirm('提示', '确认要删除?', function(result){ //to do...});
    */
    $.ZXMsg.confirm = function(confirmTitle, confirmMsg, callback){
        var confirmHtml = [
            '<div class="modal fade" id="confirm_modal" tabindex="-1" role="dialog">',
                '<div class="modal-dialog w400">',
                    '<div class="modal-content">',
                        '<div class="modal-header pb-5">',
                            '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>',
                            '<h4 class="modal-title">'+confirmTitle+'</h4>',
                        '</div>',
                        '<div class="modal-body">',
                            confirmMsg,
                        '</div>',
                        '<div class="modal-footer">',
                            '<button type="button" class="btn btn-default confirm-cancel">取消</button>',
                            '<button type="button" class="btn btn-primary confirm-ok">确定</button>',
                        '</div>',
                    '</div>',
                '</div>',
            '</div>'
        ].join('');


        // 将confirm框添加进body
        $('body').append(confirmHtml);
        
        // 确定事件
        $('#confirm_modal .confirm-ok').bind('click', function(){
            if(callback){
                callback(true);
            }

            $('#confirm_modal').modal('hide');
        });

        // 取消事件
        $('#confirm_modal .confirm-cancel').bind('click', function(){
            if(callback){
                callback(false);
            }

            $('#confirm_modal').modal('hide');
        });

        // 关闭之后清除掉自己
        $('#confirm_modal').on('hidden.bs.modal', function (e) {
            $(this).remove();
        });

        // 显示confirm框
        $('#confirm_modal').modal('show');

    }


    /*
        私信方法
        用例：
        $.ZXMsg.sendPrivateMsg('1', '半夜没事瞎溜达');
    */
    $.ZXMsg.sendPrivateMsg = function(userId, userName){
        var postUrl = '/',
            privateMsgHtml = [
                '<div class="modal fade" id="private_message_modal" role="dialog">',
                    '<div class="modal-dialog w400">',
                        '<div class="modal-content">',
                            '<form role="form" class="form-horizontal" method="post" action="">',
                                '<div class="modal-header">',
                                    '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>',
                                    '<h4 class="modal-title">发送私信</h4>',
                                '</div>',
                                '<div class="modal-body pb-0">',
                                    '<div class="form-group">',
                                        '<label class="col-sm-3 control-label">发送给</label>',
                                        '<div class="col-sm-9">',
                                            '<label id="receiver_label" class="control-label"></label>',
                                            '<input type="hidden" name="receiver">',
                                        '</div>',
                                    '</div>',
                                    '<div class="form-group">',
                                        '<label class="col-sm-3 control-label">消息内容</label>',
                                        '<div class="col-sm-9">',
                                            '<textarea rows="4" name="message" class="form-control" placeholder="请输入消息内容" value=""></textarea>',
                                        '</div>',
                                    '</div>',
                                '</div>',
                                '<div class="modal-footer">',
                                    '<button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>',
                                    '<button type="button" class="btn btn-primary send">发送</button>',
                                '</div>',
                            '</form>',
                        '</div>',
                    '</div>',
                '</div>'
            ].join('');

        
        // 是否第一次创建私信框
        if($('#private_message_modal').length == 0){
            // 将私信框添加进body
            $('body').append(privateMsgHtml);

            // 绑定发送事件
            $('#private_message_modal .send').bind('click', function(){
                // todo ...
                $('#private_message_modal').modal('hide');

                $.ZXMsg.alert('提示', '给'+userName+'的私信发送成功!', 3000);
            })
        }

        // 设置值
        $('#private_message_modal input[name=receiver]').val(userId);
        $('#private_message_modal #receiver_label').html(userName);

        // 显示
        $('#private_message_modal').modal('show');

    }


})(jQuery);



/*
// 文本编辑器默认设置
var markItUpSettings = {
    onShiftEnter:   {keepDefault:false, replaceWith:'<br />\n'},
    onCtrlEnter:    {keepDefault:false, openWith:'\n<p>', closeWith:'</p>'},
    onTab:        {keepDefault:false, replaceWith:'    '},
    markupSet:  [   
        {name:'粗体', key:'B', openWith:'<b>', closeWith:'</b>' },
        {name:'斜体', key:'I', openWith:'<i>', closeWith:'</i>'  },
        {name:'下划线', key:'U', openWith:'<u>', closeWith:'</u>' },
        {separator:'---------------' },
        {name:'无序列表', openWith:'    <li>', closeWith:'</li>', multiline:true, openBlockWith:'<ul>\n', closeBlockWith:'\n</ul>'},
        {name:'有序列表', openWith:'    <li>', closeWith:'</li>', multiline:true, openBlockWith:'<ol>\n', closeBlockWith:'\n</ol>'},
        {separator:'---------------' },
        {name:'插入图片', key:'P', replaceWith:'<img src="[![Source:!:http://]!]" alt="[![Alternative text]!]" />' },
        {name:'插入链接', key:'L', openWith:'<a href="[![Link:!:http://]!]"(!( title="[![Title]!]")!)>', closeWith:'</a>', placeHolder:'Your text to link...' },
        {separator:'---------------' },
        {name:'清除样式', className:'clean', replaceWith:function(markitup) { return markitup.selection.replace(/<(.*?)>/g, "") } }
        //,{name:'Preview', className:'preview',  call:'preview'}
    ]
};
*/


/*
    创建 KindEditor 编辑器
    selector: textarea的选择器
*/
function createEditor(selector){

    return KindEditor.create(selector, {
        resizeType : 1,
        width: '100%',
        autoHeightMode : true,
        allowPreviewEmoticons : false,
        allowImageUpload : true,
        allowImageRemote: true,
        // basePath: '/',
        uploadJson: '/save_img',
        pasteType : 1,
        cssData: 'body{font-family: "微软雅黑","Helvetica Neue",Helvetica,Arial,sans-serif; font-size: 14px; color: #222;}',
        themesPath: MEDIA_URL + "css/kindeditor/themes/",
        pluginsPath: MEDIA_URL + "js/kindeditor/plugins/",
        langPath: MEDIA_URL + "js/kindeditor/",
        items : [
            'bold', 'italic', 'underline', 'removeformat', '|', 
            'justifyleft', 'justifycenter', 'justifyright', 'insertorderedlist', 'insertunorderedlist', '|', 
            'image', 'link', '|', 
            'fullscreen'
        ],
        afterCreate : function() { 
            this.loadPlugin('autoheight');
			this.sync(); 
        }, 
        afterBlur:function(){ 
			this.sync(); 
        },
        afterUpload : function(url) {
            console.log(url);
        }
    });
}


$(document).ready(function(){
    // 回到顶部动画效果
    var userClickTop = false;

    $(window).scroll(function(){
        var me = $(this);

        if(!userClickTop){
            if(me.scrollTop() < 400){
                $('.scroll-top').hide('fast');
            }else{
                $('.scroll-top').show('fast');
            }
        }
    });

    $('.scroll-top').bind('mouseover', function(){
        var me = $(this);
        if(userClickTop){
            return;
        }

        me.animate({'opacity': '0.3'}, 200, function(){
            //me.css({'background-position-x': -149});
            me.css('background-position', '-149px 0');

            me.animate({'opacity': '0.99'}, 200);
        });
        
    })
    .bind('mouseout', function(){
        var me = $(this);
        if(userClickTop){
            return;
        }

        me.animate({'opacity': '0.3'}, 200, function(){
            //me.css({'background-position-x': 0});
            me.css('background-position', '0 0');

            me.animate({'opacity': '0.99'}, 200);
        });
        
    })
    .bind('click', function(){
        var me = $(this);
        userClickTop = true;
        me.css('background-position', '-298px 0');
        $('html,body').animate({scrollTop:0}, 'fast', function(){
            me.animate({'bottom': 800}, 500, function(){
                me.css({'bottom': 10}).hide();
                me.css('background-position', '0 0');
                userClickTop = false;
            });
        }); 
        
    });


    // 给不支持placeholder的浏览器添加此属性
      $('input, textarea').placeholder();

    // 初始化所有的 tooltip 
    $('.zx-tooltip').tooltipsy({
        offset: [1, 0],
        css: {
            'padding': '10px',
            'max-width': '200px',
            'color': '#fff',
            'background-color': '#000',
            'border': '1px solid #BEBEBE',
            '-moz-box-shadow': '0 0 10px rgba(0, 0, 0, .5)',
            '-webkit-box-shadow': '0 0 10px rgba(0, 0, 0, .5)',
            'box-shadow': '0 0 10px rgba(0, 0, 0, .5)',
            'border-radius': '4px',
            'font-size': '12px'
        }
    });
    

    // 弹出名片设置
    var cardtipsHtml = '<div class="cardtips"><div class="profile row"><div class="col-md-3"><img class="avatar avatar-circle" src="{0}" ></div><div class="col-md-9"><div class="username">{1}</div><div class="question-info"><span>提问<a href="#">{2}</a></span><span>回答<a href="#">{3}</a></span><span>赞<a href="#">{4}</a></span></div></div></div><div class="desc">{5}</div><div class="tools"><button type="button" class="btn btn-primary btn-xs follow {8}">关注ta</button><button type="button" class="btn btn-default btn-xs unfollow {9}">取消关注</button><a class="send-message" href="javascript: void(0)" data-user_name="{6}" data-user_id="{7}"><span class="glyphicon glyphicon-envelope"></span> 私信ta</a></div></div>'
    $('.zx-cardtips1').tooltipster({
        animation: 'fade',
        delay: 200,
        trigger: 'hover',
        theme: 'tooltipster-shadow',
        interactive: true,
        interactiveTolerance: 300,
        autoClose: true,
        //content: cardtipsHtml,
        contentAsHTML: true,
        content: '名片加载中...',
        functionBefore: function(origin, continueTooltip) {

            // we'll make this function asynchronous and allow the tooltip to go ahead and show the loading notification while fetching our data
            continueTooltip();
            
            // next, we want to check if our data has already been cached
            if (origin.data('ajax') !== 'cached') {
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: '/account/get_user_info_by_id?user_id=' + origin.data('user_id'),
                    success: function(data) {
                        if(data.success){
                            origin.tooltipster('content', String.format(
                                cardtipsHtml, 
                                data.avatar,
                                data.name, 
                                data.question_count,
                                data.answer_count,
                                data.like_count,
                                data.desc,
                                data.name,
                                data.id,
                                data.is_follow?'hide':'', // 关注按钮
                                data.is_follow?'':'hide' //取消关注按钮
                            )).data('ajax', 'cached');
                        } else {
                            origin.tooltipster('content', '加载名片失败');
                        }
                    }
                });
            }
        }
    });
    // 从名片上点击发私信事件 
    $('.send-message').live('click', function(){
        $.ZXMsg.sendPrivateMsg($(this).data('user_id'), $(this).data('user_name'));
    })


    /*
    // 设置编辑器
      $('.zx-textarea').markItUp(markItUpSettings);
      // 设置文本框自动增加高度
      $('.zx-textarea').bind('keyup', function(e){
        if(e.keyCode == 13){
            $(this).height($(this).height() + $(this).scrollTop() + 2);
        }
    });
    */
    

    //UE
    /*
    var ue = UE.getEditor('zx-editor', {
        toolbars: [[
             'bold', 'italic', 'underline', 'removeformat', '|',
            'insertorderedlist', 'insertunorderedlist', '|' ,
            'link', 'unlink', 'insertimage', 'insertvideo', '|',
            'preview', 'cleardoc', 'fullscreen'
        ]],
        dropFileEnabled: false,
        pasteplain: true
    });
    */

    // var ue2 = UE.getEditor('zx-editor2', {
    //     toolbars: [
    //         'bold', 'italic', 'underline', 'removeformat', '|',
    //         'insertorderedlist', 'insertunorderedlist', '|' ,
    //         'link', 'unlink', 'insertimage', 'insertvideo', '|',
    //         'preview', 'cleardoc', 'fullscreen'
    //     ],
    //     //initialFrameWidth: '100%',
    //     dropFileEnabled: false,
    //     pasteplain: true
    // });

    /* 
    //UM
    var um = UM.getEditor('zx-editor', {
        toolbar:[
            'bold italic underline removeformat |',
            'insertorderedlist insertunorderedlist |' ,
            'link unlink image insertvideo  |',
            'preview cleardoc fullscreen'
        ],
        dropFileEnabled: false
    });

    var um2 = UM.getEditor('zx-editor2', {
        toolbar:[
            'bold italic underline removeformat |',
            'insertorderedlist insertunorderedlist |' ,
            'link unlink image insertvideo  |',
            'preview cleardoc fullscreen'
        ],
        initialFrameWidth: '100%',
        dropFileEnabled: false
    });
    */
    

    
    // 鼠标移动到导航条登录用户名时自动弹出下拉框
    var dropdownTimeout = null,
        showDropdown = function(){
            $(".login-user .dropdown").addClass('open');

            if(dropdownTimeout){
                window.clearTimeout(dropdownTimeout);
                dropdownTimeout = null;
            }
        },
        hideDropdown = function(){
            if(!dropdownTimeout){
                dropdownTimeout = window.setTimeout(function(){
                    $(".login-user .dropdown").removeClass('open');
                    dropdownTimeout = null;
                }, 1000)
            }
           };
    
    $('.login-user .dropdown-toggle')
    .bind('mouseenter', showDropdown)
    .bind('mouseleave', hideDropdown);

    $('.login-user .dropdown-menu')
    .bind('mouseenter', showDropdown)
    .bind('mouseleave', hideDropdown);


    // 隐藏所有 auto-hide 样式
    $('.auto-hide').hide();
});

