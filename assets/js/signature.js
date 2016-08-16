/**
 * Created by wushuyi on 2016/8/16 0016.
 */

this.Signature = this.Signature || {};

(function () {
    "use strict";

    Signature.extend = function (subclass, superclass) {
        function o() {
            this.constructor = subclass;
        }

        o.prototype = superclass.prototype;
        return (subclass.prototype = new o());
    };

    Signature.promote = function (subclass, prefix) {
        "use strict";

        var subP = subclass.prototype, supP = (Object.getPrototypeOf && Object.getPrototypeOf(subP)) || subP.__proto__;
        if (supP) {
            subP[(prefix += "_") + "constructor"] = supP.constructor; // constructor is not always innumerable
            for (var n in supP) {
                if (subP.hasOwnProperty(n) && (typeof supP[n] == "function")) {
                    subP[prefix + n] = supP[n];
                }
            }
        }
        return subclass;
    };

    Signature.proxy = function (fn, context) {
        var deletedIds = [];

        var slice = deletedIds.slice;
        var args, proxy, tmp;

        if (typeof context === "string") {
            tmp = fn[context];
            context = fn;
            fn = tmp;
        }

        // Simulated bind
        args = slice.call(arguments, 2);
        proxy = function () {
            return fn.apply(context || this, args.concat(slice.call(arguments)));
        };

        // Set the guid of unique handler to the same of original handler, so it can be removed

        return proxy;
    };

}());

(function () {
    "use strict";

    function Pen(stage) {
        this.count = 0;
        this._mouseY = null;
        this._mouseY = null;
        this._mouseIsDown = null;
        this.lastPt = null;
        this.stage = stage;
        this.shape = null;
        this.graphics = null;
        this.canvas = this.stage.canvas;
        this._history = [];
        this._init();
    }

    var p = Pen.prototype;

    p._init = function () {
        this._initView();
        this._initText();
    };

    p.penDown = function (evt) {
        this._mouseIsDown = true;
        this.lastPt = this.shape.globalToLocal(evt.nativeEvent.pageX - this.canvas.offsetLeft
            , evt.nativeEvent.pageY - this.canvas.offsetTop);
        this.shape.uncache();
        this._history.push({pt: this.lastPt, isdown: true});
    };

    p.penUp = function (evt) {
        this._mouseIsDown = false;

        this.shape.cache(0, 0, this.canvas.width, this.canvas.height);
    };
    p.penMove = function (evt) {
        this._mouseX = evt.nativeEvent.pageX - this.canvas.offsetLeft;
        this._mouseY = evt.nativeEvent.pageY - this.canvas.offsetTop;
    };
    p.getColor = function () {
        return createjs.Graphics.getHSL(
            Math.cos((this.count++) * 0.01) * 180,
            100,
            50,
            1.0);
    };
    p._tick = function () {
        if (this._mouseIsDown) {
            var color = this.getColor();

            this.graphics.setStrokeStyle(6, "round").beginStroke(color);

            this.graphics.moveTo(this.lastPt.x, this.lastPt.y);

            this.lastPt = this.shape.globalToLocal(this._mouseX, this._mouseY);

            this.graphics.lineTo(this.lastPt.x, this.lastPt.y);

            this._history.push({pt: this.lastPt});
        }
    };
    p.getJSON = function () {
        return JSON.stringify(this._history);
    };
    p.clean = function () {
        this.stage.removeChild(this.shape);
        this._initView();
    };
    p._initView = function () {
        this.shape = new createjs.Shape();
        this.stage.addChild(this.shape);
        this.graphics = this.shape.graphics;
        this.count = 0;
        this._history = [];
    };
    p.reDraw = function (data) {
        this.clean();
        this._removeText();
        this._history = data;
        for (var i = 0; i < data.length; i++) {
            if (data[i].isdown) {
                this.lastPt = data[i].pt;
            } else {
                var color = this.getColor();

                this.graphics.setStrokeStyle(6, "round").beginStroke(color);

                this.graphics.moveTo(this.lastPt.x, this.lastPt.y);

                this.lastPt = data[i].pt;

                this.graphics.lineTo(this.lastPt.x, this.lastPt.y);
            }
        }
    };
    p._initText = function () {
        var text = new createjs.Text("秀一下你的签名", "36px Arial", "#777777");
        window.aaa = text
        text.x = 250;
        text.y = 150;
        this.text = text;
        var _this = this;
        this.stage.addChild(text);
        this.stage.on("stagemousedown", function () {
            _this._removeText();
        }, true);
    };
    p._removeText = function () {
        this.stage.removeChild(this.text);
    };

    Signature.Pen = Signature.promote(Pen, "Container");
})();

(function () {
    "use strict";
    function Pad(id) {
        this.stage = null;
        this.shape = null;
        this.pen = null;
        this._init(id);
    }

    var p = Pad.prototype;

    p._init = function (id) {

        this.stage = new createjs.Stage(id);
        this.stage.enableDOMEvents(true);

        createjs.Ticker.setFPS(30);
        createjs.Ticker.on("tick", Signature.proxy(this._tick, this));

        this._initPen();
    };
    p._initPen = function () {

        this.pen = new Signature.Pen(this.stage);

        this.stage.on("stagemousemove", Signature.proxy(this.pen.penMove, this.pen));
        this.stage.on("stagemousedown", Signature.proxy(this.pen.penDown, this.pen));
        this.stage.on("stagemouseup", Signature.proxy(this.pen.penUp, this.pen));

    };
    p._tick = function (event) {
        this.pen._tick();
        this.stage.update(event);
    };


    // 获取json数据
    p.getJSON = function () {
        return JSON.stringify(this.pen.getJSON());
    };
    // 获取json文件
    p.getJSONFile = function () {
        var json = this.getJSON();
        var date = new Date();
        var file = new File([json], "data.json", {type: "text/plain", lastModified: date});
        var down = new DownloadManager();
        down.download(file, null, 'data.json');
    };
    p.reDraw = function (data) {
      return this.pen.reDraw(data);
    };
    // 获取dataURL图片
    p.getDataURL = function () {
        return this.stage.toDataURL();
    };

    Signature.Pad = Signature.promote(Pad, "Container");
})();