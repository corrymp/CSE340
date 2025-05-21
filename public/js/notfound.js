const canvas = document.getElementById('canvas');
const canvas2 = document.getElementById('canvas2');

const s = getComputedStyle(canvas);

const width = canvas2.width = (canvas.width = parseInt(s.getPropertyValue('width')));
const height = canvas2.height = (canvas.height = parseInt(s.getPropertyValue('height')));

const ctx = canvas.getContext('2d');
const ctx2 = canvas2.getContext('2d');

const rect = canvas.getBoundingClientRect();

let curX, curY, pressed = false, moving = false;

ctx.strokeStyle = (ctx2.strokeStyle = '#000');
ctx.lineWidth = 2;
ctx2.lineWidth = 4;

const draw = () => {
    if (pressed && moving) {
        ctx.beginPath();
        ctx.arc(curX, curY, 1, 0, Math.PI * 2);
        ctx.stroke();
        ctx2.lineTo(curX,curY);
        moving = false;
    }
    requestAnimationFrame(draw);
}

canvas.addEventListener('mousedown', _ => {
    if(moving) ctx2.beginPath();
    pressed = true;
});

canvas.addEventListener('mouseup', _ => {
    ctx2.stroke();
    pressed = false;
});

document.addEventListener('mousemove', e => {
    curX = e.clientX - rect.left;
    curY = e.clientY - rect.top;
    moving = true;
    if(e.target !== canvas && e.target !== canvas2) {
        moving = false;
        pressed = false;
        ctx2.stroke();
    }
});

draw();
