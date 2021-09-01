(function ($) {
    "use strict";

    if (!checkCookie()) {
        window.location.href = "index.html";
    }

    const radiography = $('.container-radiography .radiography');
    const containerCanvas = $('.container-canvas');
    const canvas = document.querySelector(".container-canvas .canvas");

    const ctx = canvas.getContext("2d");

    const statuses = new Array();
    const boxes = new Array();
    const originalImageSize = new Array(0, 0);

    let painting = false;
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    let currentId = 0;
    let currentClassId = 0;
    control(currentId, 'next', true);

    /*==================================================================
    [ Select Label ]*/
    $(".select-label .default-option").click(function () {
        $(this).parent().toggleClass("active");
    })

    $(".select-label .select-ul li").click(function () {
        currentClassId = $(this).val();
        $(".select-label .default-option li").html($(this).html());
        $(this).parents(".select-label").removeClass("active");
    })

    /*==================================================================
    [ Previous ]*/
    $('.previous-btn').on('click', function (e) {
        e.preventDefault();
        containerCanvas.hide();
        clearCanvas();
        control(currentId, 'previous');
    });

    /*==================================================================
    [ Confirm ]*/
    $('.confirm-btn').on('click', function (e) {
        e.preventDefault();
        console.log(boxes);
        confirm(currentId, currentClassId, boxes);
    });

    /*==================================================================
    [ Undo ]*/
    $('.undo-btn').on('click', function (e) {
        e.preventDefault();
        if (statuses.length > 1) {
            statuses.pop();
            ctx.putImageData(statuses[statuses.length - 1], 0, 0);
        }
    });

    /*==================================================================
    [ Next ]*/
    $('.next-btn').on('click', function (e) {
        e.preventDefault();
        containerCanvas.hide();
        clearCanvas();
        control(currentId, 'next');
    });

    /*==================================================================
    [ Close ]*/
    $('.container-popup .popup .close').on('click', function (e) {
        e.preventDefault();
        popup(false, '');
    });

    /*==================================================================
    [ Radiography ]*/
    radiography.on("load", function () {
        clearCanvas();
        initCanvas();
        containerCanvas.show();
        originalImageSize[0] = this.naturalWidth;
        originalImageSize[1] = this.naturalHeight;
    }).each(function () {
        if (this.complete) {
            $(this).trigger('load')
        };
    });

    /*==================================================================
    [ Canvas ]*/
    function startPosition(e) {
        painting = true;
        startX = e.offsetX;
        startY = e.offsetY;
    }

    function stopPosition(e) {
        painting = false;
        endX = e.offsetX;
        endY = e.offsetY;
        const box = {
            x: startX <= endX ? startX : endX,
            y: startY <= endY ? startY : endY,
            width: Math.abs(endX - startX),
            height: Math.abs(endY - startY),
        };
        const originalBox = {
            x: 1.0 * originalImageSize[0] * box.x / radiography.width(),
            y: 1.0 * originalImageSize[1] * box.y / radiography.height(),
            width: 1.0 * originalImageSize[0] * box.width / radiography.width(),
            height: 1.0 * originalImageSize[1] * box.height / radiography.height(),
        };
        boxes.push(originalBox);
        statuses.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }

    function draw(e) {
        if (!painting) {
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(statuses[statuses.length - 1], 0, 0);
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 3;
        ctx.strokeRect(startX, startY, e.offsetX - startX, e.offsetY - startY);
    }

    function initCanvas() {
        statuses.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        canvas.offsetwidth = radiography.width();
        canvas.offsetheight = radiography.height();
        canvas.width = radiography.width();
        canvas.height = radiography.height();
        canvas.addEventListener('mousedown', startPosition);
        canvas.addEventListener('mouseup', stopPosition);
        canvas.addEventListener('mousemove', draw);
    }

    function clearCanvas() {
        boxes.length = 0;
        statuses.length = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.removeEventListener('mousedown', startPosition);
        canvas.removeEventListener('mouseup', stopPosition);
        canvas.removeEventListener('mousemove', draw);
    }

    /*==================================================================
    [ Window ]*/
    $(window).resize(function () {
        clearCanvas();
        initCanvas();
    });

    /*==================================================================
    [ Popup ]*/
    function popup(show, message) {
        $('.container-popup .popup .message').text(message);
        const popup = $('.container-popup');
        if (show) {
            popup.show();
        } else {
            popup.hide();
        }
    }

    function disableBtn() {
        $('.previous-btn').prop("disabled", true);
        $('.confirm-btn').prop("disabled", true);
        $('.undo-btn').prop("disabled", true);
        $('.next-btn').prop("disabled", true);
        containerCanvas.hide();
        clearCanvas();
    }

    function control(id, control, init) {

        const loader = $('.container-loader');
        loader.show();

        const request = $.ajax({
            url: 'https://a74e-180-129-101-226.ngrok.io/' + control + '?id=' + id,
            type: 'get',
        });

        // Callback handler that will be called on success
        request.done(function (response, textStatus, jqXHR) {
            // Log a message to the console
            loader.hide();
            const result = JSON.parse(JSON.stringify(response));
            console.log(result);
            if (result.code == 0) {
                if (result.id != -1) {
                    currentId = result.id;
                    radiography.attr('src', 'https://a74e-180-129-101-226.ngrok.io/show/' + currentId + '.png');
                } else {
                    if (control == 'previous') {
                        if (init) {
                            radiography.attr('src', '../images/radiography.png');
                            disableBtn();
                            popup(true, 'All images are labeled.');
                        } else {
                            popup(true, 'This is the first page.');
                        }
                    } else {
                        if (init) {
                            radiography.attr('src', '../images/radiography.png');
                            disableBtn();
                            popup(true, 'All images are labeled.');
                        } else {
                            popup(true, 'This is the last page.');
                        }
                    }
                }
            }
        });

        // Callback handler that will be called on failure
        request.fail(function (jqXHR, textStatus, errorThrown) {
            // Log the error to the console
            console.error(
                'The following error occurred: ' +
                textStatus, errorThrown
            );
            loader.hide();
        });

        // Callback handler that will be called regardless
        // if the request failed or succeeded
        request.always(function () {

        });
    }

    function confirm(id, classId, boxes) {

        const loader = $('.container-loader');
        loader.show();

        const data = {
            id: id,
            class: classId,
            boxes: boxes,
        }

        const request = $.ajax({
            url: 'https://a74e-180-129-101-226.ngrok.io/draw',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(data),
        });

        // Callback handler that will be called on success
        request.done(function (response, textStatus, jqXHR) {
            // Log a message to the console
            loader.hide();
            const result = JSON.parse(JSON.stringify(response));
            console.log(result);
            if (result.code == 0) {
                if (result.id != -2) {
                    currentId = result.id;
                    radiography.attr('src', 'https://a74e-180-129-101-226.ngrok.io/show/' + currentId + '.png');
                } else {
                    radiography.attr('src', '../images/radiography.png');
                    disableBtn();
                    popup(true, 'All images are labeled.');
                }
            } else {
                popup(true, 'Labelling failed! Please label again!');
            }
        });

        // Callback handler that will be called on failure
        request.fail(function (jqXHR, textStatus, errorThrown) {
            // Log the error to the console
            console.error(
                'The following error occurred: ' +
                textStatus, errorThrown
            );
            loader.hide();
        });

        // Callback handler that will be called regardless
        // if the request failed or succeeded
        request.always(function () {

        });
    }

})(jQuery);