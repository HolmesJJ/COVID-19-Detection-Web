/*==================================================================
[ Cookie ]*/
function setCookie(c_name, value, expiredays) {
    const exdate = new Date();
    exdate.setDate(exdate.getDate + expiredays);
    document.cookie = c_name + "=" + escape(value) + ((expiredays == null) ? "" : ";expires=" + exdate.toGMTString());
}

function getCookie(c_name) {
    // 首先查询cookie是否是空的
    if (document.cookie.length > 0) {
        // 检测这个cookie是否存在
        let c_start = document.cookie.indexOf(c_name + "=");
        // 如果cookie存在
        if (c_start != -1) {
            // 获取到cookie的值的开始位置
            c_start = c_start + c_name.length + 1;
            // 从c_start开始查找";"的存在
            let c_end = document.cookie.indexOf(";", c_start);
            // 如果没找到，说明是最后一项
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            // 把cookie的值拆分出来并且对这个值进行解码，unescape()与escape()相对，对被escape()编码的字符串进行解码
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    // 不存在就返回空
    return "";
}

function checkCookie() {
    const username = getCookie("username");
    if (username == null || username == "") {
        return false;
    } else {
        return true;
    }
}

(function ($) {
    /*==================================================================
    [ Logout ]*/
    $(".logout").click(function () {
        setCookie("username", "", -1);
        window.location.href = "index.html";
    });
})(jQuery);