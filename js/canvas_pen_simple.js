class drawingCanvas {
  constructor(container){
    this.container = container;
    this.containerRect = this.container.getBoundingClientRect();
    this.penCanvas = container.querySelector('.pen_cavnas');
    this.penContext = this.penCanvas.getContext('2d');


    this.drawnPaths = [];
    this.isDrawing = false;
    this.PEN_OPACITY = '33';
    this.PEN_OPACITY_SCALE = 3;
    this.lastPoint = null; 
    this.frameRequest = null; // 프레임 요청 ID

    this.lastEventTime = 0;
    this.eventThrottle = 10;

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
    this.penCanvas.width = this.containerRect.width;
    this.penCanvas.height = this.containerRect.height;
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
      this.lastPoint = pathData; // 마지막 점 초기화

    }
  }
  pointerMove = (event) => {
    if (this.isDrawing && (event.pointerType == 'pen' || this.penData.finger)) {
      const now = Date.now();
      if (now - this.lastEventTime > this.eventThrottle) {
        this.lastEventTime = now;
        this.addPoint(event);
      }
    }
  }
  pointerUp = (event) => {
    if(event.pointerType == 'pen' || this.penData.finger){
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

  // 펜 스타일 지정
  setContextStyle(context, data){
    context.strokeStyle = data.color;
    context.lineWidth = data.lineWidth
    context.lineCap = data.lineCap;
    context.lineJoin = data.lineJoin;
  }

  drawSmoothLine(from, mid, to){
    this.setContextStyle(this.penContext, to);
    this.penContext.beginPath();
    this.penContext.moveTo(from.x, from.y);
    this.penContext.quadraticCurveTo(mid.x, mid.y, to.x, to.y);
    this.penContext.stroke();
  }
  midPointBtw(p1, p2) {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };
  }

  addPoint(event) {
    const pathData = this.getDrawnPathData(event);
    if (this.lastPoint) {
      const midPoint = this.midPointBtw(this.lastPoint, pathData);
      this.drawnPaths[this.drawnPaths.length - 1].push(midPoint, pathData);
      this.requestDraw();
    }
    this.lastPoint = pathData;
  }

  requestDraw() {
    if (!this.frameRequest) {
      this.frameRequest = requestAnimationFrame(this.draw);
    }
  }

  draw = () => {
    this.frameRequest = null;
    const currentPath = this.drawnPaths[this.drawnPaths.length - 1];
    if (currentPath && currentPath.length > 1) {
      for (let i = 1; i < currentPath.length; i += 2) {
        this.drawSmoothLine(currentPath[i - 1], currentPath[i], currentPath[i + 1] || currentPath[i]);
      }
    }
  }

}




























const __handleCanvas = document.querySelectorAll('.handle_canvas');
__handleCanvas.forEach((_handleCanvas)=>{
  const handleCanvas = new drawingCanvas(_handleCanvas);
  handleCanvas.init();
})

