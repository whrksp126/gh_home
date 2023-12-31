class drawingCanvas {
  constructor(container){
    this.container = container;
    this.containerRect = this.container.getBoundingClientRect();
    this.imgCanvas = container.querySelector('.img_canvas');
    this.imgContext = this.imgCanvas.getContext('2d');
    this.penCanvas = container.querySelector('.pen_canvas');
    this.penContext = this.penCanvas.getContext('2d');
    this.preCanvas = container.querySelector('.pre_canvas');
    this.preContext = this.preCanvas.getContext('2d');

    this.frameRequest = null;
    this.lastEventTime = 0;
    this.eventThrottle = 20;

    this.drawnPaths = [];
    this.isDrawing = false;
    this.PEN_OPACITY = '33';
    this.PEN_OPACITY_SCALE = 3;

    this.state = { x: 0, y: 0, scale: 1 };
    this.imgLast = { x: 0, y: 0 };

    this.penData = {
      finger: false,
      tool : '1',
      thickness : '2',
      color : '#252525'
    };
  }

  init(){
    this.setCanvasSize();
    this.setEvent();
  }

  setCanvasSize(){ 
    this.containerRect = this.container.getBoundingClientRect();
    this.imgCanvas.width = this.containerRect.width;
    this.imgCanvas.height = this.containerRect.height;
    this.penCanvas.width = this.containerRect.width;
    this.penCanvas.height = this.containerRect.height;
    this.preCanvas.width = this.containerRect.width;
    this.preCanvas.height = this.containerRect.height;
  }

  setEvent(){
    this.container.addEventListener('pointerdown', this.pointerDown);
    this.container.addEventListener('pointermove', this.pointerMove);
    this.container.addEventListener('pointerup', this.pointerUp);
  }


  pointerDown = (event) => {
    if(event.pointerType == 'pen' || this.penData.finger){
      this.isDrawing = true;
      const pathData = this.getDrawnPathData(event);
      this.drawnPaths.push([pathData]);
    }
  }
  pointerMove = (event) => {
    if( this.isDrawing && (event.pointerType == 'pen' || this.penData.finger)){
      const now = Date.now();
      if (now - this.lastEventTime > this.eventThrottle) {
        this.lastEventTime = now;
        this.addPoint(event);
      }
    }
  }
  pointerUp = (event) => {
    if(event.pointerType == 'pen' || this.penData.finger){
      const leng = this.drawnPaths.length;
      this.clearPreCanvas(this.drawnPaths[leng - 1]);
      this.draw(this.penContext);
      this.isDrawing = false;
      return 
    }
  }


  getDrawnPathData(event){
    const targetRect = event.target.getBoundingClientRect()
    
    const tool = Number(this.penData.tool);
    const color = tool == 2 ? this.penData.color + this.PEN_OPACITY : this.penData.color;
    const thickness = Number(this.penData.thickness);
    
    const capAndJoin = tool == 1 ? 'round' : 'butt';
    const lineWidth = tool == 2 ? thickness * this.PEN_OPACITY_SCALE : thickness;
    return {
      x: event.clientX - targetRect.left, 
      y: event.clientY - targetRect.top, 
      color: color,
      lineWidth: lineWidth,
      lineCap : capAndJoin,
      lineJoin : capAndJoin,
      force : event.pressure,
      tiltX : event.tiltX,
      tiltY : event.tiltY,
      type : event.pointerType,
    }
  }

  addPoint(event) {
    const pathData = this.getDrawnPathData(event);
    const leng = this.drawnPaths.length;
    this.drawnPaths[leng - 1].push(pathData);
    this.clearPreCanvas(this.drawnPaths[leng - 1]);
    this.requestDraw();
  }
  requestDraw() {
    if (!this.frameRequest) {
      this.frameRequest = requestAnimationFrame(() => this.draw(this.preContext));
    }
  }

  draw = (ctx) => {
    this.frameRequest = null;
    const path = this.drawnPaths[this.drawnPaths.length - 1];
    if (path && path.length > 1) {
      this.setContextStyle(ctx, path[0]);
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length - 1; i++) {
        const c = (path[i].x + path[i + 1].x) / 2;
        const d = (path[i].y + path[i + 1].y) / 2;
        ctx.quadraticCurveTo(path[i].x, path[i].y, c, d); 
      }
      ctx.stroke();
    }
  }

  // preCanvas에 현재 영역만 지우기
  clearPreCanvas(path){
    const defaultLineWidth = path[0].lineWidth;
    const clearBoxData = this.calculateBoundingBox(path);
    const calcSpace = (clearBoxData.maxF) + defaultLineWidth;
    const clearX = clearBoxData.minX - calcSpace;
    const clearY = clearBoxData.minY - calcSpace;
    const clearWidth = clearBoxData.maxX - clearBoxData.minX + (calcSpace*2); 
    const clearHeight = clearBoxData.maxY - clearBoxData.minY + (calcSpace*2);

    this.preContext.clearRect(clearX, clearY, clearWidth, clearHeight);
  }

  // 최소 clearRect 영역 계산하기
  calculateBoundingBox = (points) => {
    const { x, y, force } = points[0];
    return points.reduce(({ minX, minY, maxX, maxY, maxF }, { x, y, force }) => ({
      minX: Math.min(minX, x),
      minY: Math.min(minY, y),
      maxX: Math.max(maxX, x),
      maxY: Math.max(maxY, y),
      maxF: Math.max(maxF, force)
    }), { minX: x, minY: y, maxX: x, maxY: y, maxF: force });
  };   

  // 펜 스타일 지정
  setContextStyle(context, data){
    context.strokeStyle = data.color;
    context.lineWidth = data.lineWidth
    context.lineCap = data.lineCap;
    context.lineJoin = data.lineJoin;
  }
}




























const __handleCanvas = document.querySelectorAll('.handle_canvas');
__handleCanvas.forEach((_handleCanvas)=>{
  const handleCanvas = new drawingCanvas(_handleCanvas);
  handleCanvas.init();
})

