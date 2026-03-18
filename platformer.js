const abs = Math.abs,
      round = Math.round;

var canvas, ctx, keys, fps, run, stop, epsi;

window.onload = function(event) {
  canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');

  canvas.style.position = 'absolute';
  canvas.style.left = '0px';
  canvas.style.top = '0px';

  resize = function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.onresize = resize;

  resize();

  document.body.style.backgroundColor = 'black';

  ctx.goto = function(x,y) {
    this.moveTo(x+canvas.width/2-.5,canvas.height/2-y-.5);
  }
  ctx.lineto = function(x,y) {
    this.lineTo(x+canvas.width/2-.5,canvas.height/2-y-.5);
  }

  epsi = .0000001;

  keys = (() => {
    const keys = [
      'KeyW','KeyA','KeyS','KeyD',
      'ArrowUp','ArrowLeft','ArrowDown','ArrowRight'
    ];
    let states = {
      KeyW: false,
      KeyA: false,
      KeyS: false,
      KeyD: false,
      ArrowUp: false,
      ArrowLeft: false,
      ArrowDown: false,
      ArrowRight: false
    }

    window.onkeydown = function(event) {
      let key = event.code;
      if (keys.includes(key)) states[key] = true;
    }
    window.onkeyup = function(event) {
      let key = event.code;
      if (keys.includes(key)) states[key] = false;
    }
    window.onblur = function() {
      keys.forEach(key => states[key] = false);
    }

    let _keys = {};

    Object.defineProperties(_keys, {
      up: {
        get() {return states.KeyW || states.ArrowUp}
      },
      left: {
        get() {return states.KeyA || states.ArrowLeft}
      },
      down: {
        get() {return states.KeyS || states.ArrowDown}
      },
      right: {
        get() {return states.KeyS || states.ArrowRight}
      }
    });

    return _keys;
  })();

  init();
  loop();
  
}

var player, camera, platform, score, platforms;
function init() {
  player = {x:0,y:0,vx:0,vy:0,w:8,h:12,air:0};
  camera = {x:0,y:0};
  platforms = [];
  platform = 0;
  score = 0;
  deletePlatform('all');
  addPlatform(0,-20,50,8);
}

function addPlatform(x,y,w,h) {
  platforms.push({x,y,w,h,col:0});
}

function deletePlatform(index) {
  if (index == 'all') {
    return platforms.splice(0,platforms.length);
  }
  platforms.splice(index,1);
}

function loop() {
  requestAnimationFrame(loop);
  upd();
  draw();
}

function upd() {
  if (player.vy < -15) {
    init();
    return;
  }
  if (abs(player.x - platforms.at(-1).x) < 500) {
    generatePlatform(50);
  }
  player.vy += 1/(player.vy - 10/(1.75-keys.up));
  if (player.air < 8 && keys.up) player.vy = 3.1;
  stepY(player.vy);
  player.vx += .165*(keys.right - keys.left);
  player.vx *= .9;
  stepX(player.vx);
  camera.x += (player.x - camera.x) / 8;
  camera.y += (player.y - camera.y) / 8;
}

function getFrameRate(frames) {
  frames.unshift(Date.now());
  frames.pop();
  fps = (frames.length / (frames[0] - frames.at(-1))) * 1000;
}

function random(min,max) {
  min = Math.floor(min);
  max = Math.floor(max);
  return min + Math.floor((max-min+1) * Math.random());
}

function f(x) {return -.00000000995319442440972*x*x*x*x + .000016156*x*x*x - .0190809*x*x + 1.94959*x + 12.5449}

function generatePlatform(n) {
  let x,y,w,h;
  for (let i = 0; i < n; i++) {
    if (999 < score) {
      w = random(1,6);
      h = random(1,4);
    } else {
      if (50 - score/10 < 8) {
        w = random(2,8);
      } else {
        w = random(2,50 - score/10);
      }
      if (15 - score/50 < 6) {
        h = random(2,6);
      } else {
        h = random(4,15 - score/50);
      }
    }
    x = random(10,150);
    y = f(x);
    y -= random(0,50);
    let last = platforms.at(-1);
    x += last.x + (last.w + w)/2;
    y += last.y - (last.h + h)/2;
    addPlatform(x,y,w,h);
  }
}

function checkCollision(x1,y1,w1,h1,x2,y2,w2,h2) {
  return abs(x1-x2) < (w1+w2) / 2 && abs(y1-y2) < (h1+h2) / 2;
}

function checkCollisions() {
  return platforms.findIndex((platform,i) => checkCollision(
    player.x,player.y,player.w,player.h,
    platform.x,platform.y,platform.w,platform.h
  ));
}

function stepX(dir) {
  if (abs(dir) < 1) {
    player.x += dir;
  } else {
    player.x += dir/abs(dir);
  }
  var c = checkCollisions();
  if (c > -1) {
    player.vx = 0;
    player.x = platforms[c].x + dir/abs(dir) * (player.w + platforms[c].w + epsi) / -2;
    return;
  }
  if (abs(dir) >= 1) stepX(dir - dir/abs(dir));
};

function stepY(dir) {
  if (abs(dir) < 1) {
    player.y += dir;
  } else {
    player.y += dir/abs(dir);
  }
  var c = checkCollisions();
  if (c > -1) {
    if (c > platform) {
      score += (c - platform)*2 - 1;
      platform = c;
      platforms[c].col = 100;
    }
    player.vy = 0; 
    player.y = platforms[c].y + dir/abs(dir) * (player.h + platforms[c].h + epsi) / -2;
    if (dir < 0) {
      player.air = 0;
    }
    return;
  }
  player.air++;
  if (abs(dir) >= 1) stepY(dir - dir/abs(dir));
};

function draw() {
  drawBG();
  drawPlatforms();
  drawPlayer();
  drawScore();
}

function drawRect(x,y,w,h) {
  ctx.beginPath();
  x = round(x - camera.x - w/2);
  y = round(y - camera.y - h/2);
  ctx.goto(x,y);
  x += w;
  ctx.lineto(x,y);
  y += h;
  ctx.lineto(x,y);
  x -= w;
  ctx.lineto(x,y);
  y -= h;
  ctx.lineto(x,y);
  ctx.stroke();
  ctx.closePath();
}

function drawBG() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

function drawPlatforms() {
  ctx.lineWidth = 1;
  c = 120;
  platforms.forEach(p => {
    if (p.col > 0) {
      c += p.col;
      ctx.strokeStyle = 'hsl(' + c + ' 100% 50%)';
      drawRect(p.x,p.y,p.w,p.h);
      c += 1 - p.col;
      p.col -= 2;
    } else {
      c++;
      c %= 360;
      ctx.strokeStyle = 'hsl(' + c + ' 100% 50%)';
      drawRect(p.x,p.y,p.w,p.h);
    }
  })
}

function drawPlayer() {
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'red';
  drawRect(player.x,player.y,player.w,player.h);
}

function drawScore() {
  ctx.font = '18px monospace';
  ctx.fillStyle = 'white';
  ctx.fillText(score, 8, 22);
}
