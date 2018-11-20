; (function (window, undefined) {

  /**
 * @desc 图片放大类  使用： new ImgZoom(el, options)
 * @param {DOM Element} elImg 图片element对象
 * @param {Object} options 配置参数
 **/
  class ImgZoom {
    constructor(elImg, opts) {
      const self = this;
      this.elImg = elImg;

      this.options = {
        MAX_SCALE: 2,
        MIN_SCALE: 1,
        SCALE_PER_WHEEL: 0.25,
        ...opts
      }

      this.mousedownTranslate = {
        x: 0,
        y: 0
      };
      this.mousedownPageX = 0;
      this.mousedownPageY = 0;
      this.scale = 1;

      this.elImg.imgZoom = this;
      this.init();

    }
    init() {
      console.log('init...')
      this.elImg.addEventListener('mousewheel', mousewheelCb);
      this.elImg.addEventListener('mousedown', mousedownCb);
    }
  }


  /**
  * @desc 鼠标点击事件
  */
  function mousedownCb(e) {

    var $dom = e.target;
    var imgZoomInst = $dom.imgZoom;             // 该图片所关联的ImgZoom实例
    var translateRes = getTranslate($dom);      // translate结果 {x: xxx, y: xxx}

    if (!imgZoomInst) return;

    imgZoomInst.mousedownPageX = e.pageX;
    imgZoomInst.mousedownPageY = e.pageY;

    //记录鼠标按下时图片的 translate
    imgZoomInst.mousedownTranslate = {
      x: translateRes.x,
      y: translateRes.y
    };

    //绑定事件 mousemove和mouseup事件
    $dom.addEventListener('mousemove', mousemoveCb);
    $dom.addEventListener('mouseup', mouseupCb);
    $dom.addEventListener('mouseleave', mouseoutCb);

    //拖拽图片时图片的 transition时间不能太大
    $dom.style.transitionDuration = '0.1s';

    e.preventDefault();
  }

  /**
  * @desc 鼠标移动的回调（鼠标按下后才触发，鼠标松开就不再触发）
  */
  function mousemoveCb(e) {
    var $dom = e.target;
    var imgZoomInst = $dom.imgZoom;
    var translateX = imgZoomInst.mousedownTranslate.x + (e.pageX - e.target.imgZoom.mousedownPageX);
    var translateY = imgZoomInst.mousedownTranslate.y + (e.pageY - e.target.imgZoom.mousedownPageY);

    //边界校验
    if(imgZoomInst.scale >= 1) {
      var canMovePixX = $dom.offsetWidth * 0.5 * (imgZoomInst.scale - 1);
      var canMovePixY = $dom.offsetHeight * 0.5 * (imgZoomInst.scale - 1);
      if (translateX > canMovePixX) translateX = canMovePixX;
      if (translateX < -canMovePixX) translateX = -canMovePixX;
      if (translateY > canMovePixY) translateY = canMovePixY;
      if (translateY < -canMovePixY) translateY = -canMovePixY;
    } else {
      return;
    }

    //赋translate值给图片
    setTranslate($dom, translateX, translateY);
  }

  /**
  * @desc 鼠标松开的回调（解绑鼠标移动、松开事件）
  */
  function mouseupCb(e) {
    var $dom = e.target;
    $dom.removeEventListener('mousemove', mousemoveCb);
    $dom.removeEventListener('mouseup', mouseupCb);
    $dom.removeEventListener('mouseleave', mouseoutCb);
    //拖拽图片时图片的 transition时间不能太大
    $dom.style.transitionDuration = '0.5s';

  }

  /**
  * @desc 拖拽图片过程中鼠标离开了图片
  */
  function mouseoutCb(e) {
    mouseupCb(e);
  }

  /**
  * @desc 防止mousewheel一秒N次触发
  */
  function proxyMouseWheel() {
    var timer = null;
    var isLock = false;
    return function (e) {
      if (isLock && !timer) {
        timer = setTimeout(function () {
          isLock = false;
          timer = null;
          //mousewheelCb(e)
        }, 300)
      } else if (!isLock) {
        isLock = true;
        mousewheelCb(e)
      }
    }
  }

  /**
  * @desc 鼠标滚轮事件回调
  */
  function mousewheelCb(e) {
    var elImg = e.target;
    var imgZoomInst = elImg.imgZoom;

    var curScale = elImg.style.transform.match(/scale\((.*?)\)/) && elImg.style.transform.match(/scale\((.*?)\)/)[1] || 1;

    curScale = parseFloat(curScale);
    console.log(`curScale=${curScale}`);

    if (e.wheelDelta > 0) {
      curScale += imgZoomInst.options.SCALE_PER_WHEEL;
    } else {
      curScale -= imgZoomInst.options.SCALE_PER_WHEEL;
    }
    if (curScale > imgZoomInst.options.MAX_SCALE) return;
    if (curScale < imgZoomInst.options.MIN_SCALE) return;

    var value = elImg.style.transform && elImg.style.transform.replace(/scale\((.*)\)/, 'scale(' + curScale + ')') || 'scale(' + curScale + ')';
    var translateRes = getTranslate(elImg);
    
    var offsetX = curScale >=1 ? e.offsetX : elImg.offsetWidth/2;
    var offsetY = curScale >=1 ? e.offsetY : elImg.offsetHeight/2;

    console.warn(`offsetX=${offsetX}`);

    var translateX = (e.wheelDelta > 0 ? 1 : -1) * (e.target.offsetWidth / 2 - offsetX) * imgZoomInst.options.SCALE_PER_WHEEL + translateRes.x;
    var translateY = (e.wheelDelta > 0 ? 1 : -1) * (e.target.offsetHeight / 2 - offsetY) * imgZoomInst.options.SCALE_PER_WHEEL + translateRes.y;

    //边界校验
    if(curScale >= 1) {
      var canMovePixX = elImg.offsetWidth * 0.5 * (curScale - 1);
      var canMovePixY = elImg.offsetHeight * 0.5 * (curScale - 1);
      if (translateX > canMovePixX) translateX = canMovePixX;
      if (translateX < -canMovePixX) translateX = -canMovePixX;
      if (translateY > canMovePixY) translateY = canMovePixY;
      if (translateY < -canMovePixY) translateY = -canMovePixY;
    }
    

    //console.warn(`canMovePixX=${canMovePixX}, translateX=${translateX}`);

    value = ` translate(${translateX}px, ${translateY}px) scale(${curScale})`;

    //finally give value
    elImg.style.transform = value;

    //缓存进实例
    elImg.imgZoom.scale = curScale;

  }

  /**
  * @desc 获取当前图片的 transform: scale(xxx) 的 xxx
  * @param {DOM Element} dom 
  */
  function getScale(dom) {
    var reg = /scale\((.*?)\)/;
    var matchRes = dom.style.transform.match(reg);
    if (matchRes && matchRes[1]) {
      return matchRes[1];
    } else {
      return 1;
    }
  }

  /**
  * @desc 获取一个element对象的translateX和translateY
  * @param {DOM ELEMENT} dom
  * @return {Object} {x: xxx, y: xxx}
  */
  function getTranslate(dom) {
    var result = {
      x: 0,
      y: 0
    }
    var reg = /translate\((.*)\)/;
    var matchRes = dom.style.transform.match(reg);

    if (matchRes && matchRes[1]) {
      var splitRes = matchRes[1].split(',');
      result.x = parseFloat(splitRes[0].replace('px', ''));
      result.y = parseFloat(splitRes[1].trim().replace('px', ''));

    }
    return result;
  }

  /**
  * @desc 设置 图片translate的值
  * @param {DOM Element} dom dom Element对象
  * @param {Number} x translateX的值
  * @param {Number} y translateY的值
  */
  function setTranslate(dom, x, y) {
    //console.error(dom, x, y)
    if (dom.style.transform.indexOf('translate') > -1) {
      dom.style.transform = dom.style.transform.replace(/translate\((.*?)\)/, `translate(${x}px, ${y}px)`);
    } else {
      dom.style.transform = dom.style.transform += ` translate(${x}px, ${y}px)`
    }
  }

  window.ImgZoom = ImgZoom;

}(window));