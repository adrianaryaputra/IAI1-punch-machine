export class ClickableButton{

    constructor({
        parent,
        text = ' ',
        color = '#fff',
        callback,
        isEnable = true,
        style,
    } = {}) {
        if(parent) this.parent = parent;
        this.text = text;
        this.color = color;
        this.currentColor = color;
        this.callback = callback;
        this._generateHTML();
        this._styling();

        this.enable(isEnable);

        for (const key in style) {
            this.elem.style[key] = style[key];
        }
    }

    enable(isEnable) {
        if(!isEnable){
            this.elem.style.backgroundColor = "#AAA";
            this.currentColor = "#AAA";
            this.elem.setAttribute("disabled", "true");
        } else {
            this.elem.removeAttribute("disabled");
            this.elem.style.backgroundColor = this.color;
            this.currentColor = this.color;
        }
        this._restyle();
    }

    active(cond) {
        if(cond){
            this.elem.style.backgroundColor = "#0F0";
            this.currentColor = "#0F0";
        } else {
            this.elem.style.backgroundColor = this.color;
            this.currentColor = this.color;
        }
        this._restyle();
    }

    warn(cond) {
        if(cond){
            this.warnInterval = setInterval(() => {
                this.elem.style.backgroundColor = "#FF0";
                this.currentColor = "#FF0";
                this._restyle();
                setTimeout(() => {
                    this.elem.style.backgroundColor = this.color;
                    this.currentColor = this.color;
                    this._restyle();
                }, 500)
            }, 1000);
        } else {
            this.elem.style.backgroundColor = this.color;
            this.currentColor = this.color;
            clearInterval(this.warnInterval);
            this._restyle();
        }
    }

    element() {
        return this.elem;
    }

    _LightenDarkenColor(col, amt) {
        var usePound = false;
        if (col[0] == "#") {
            col = col.slice(1);
            usePound = true;
        }
        if (col.length == 3 || col.length == 4) {
           let x = col.split(/(.{1})/).filter(v => v!='');
           col = [x[0], x[0], x[1], x[1], x[2], x[2]].join('');
        }
        var num = parseInt(col,16);
        var r = (num >> 16) + amt;
        if (r > 255) r = 255;
        else if  (r < 0) r = 0;
        var b = ((num >> 8) & 0x00FF) + amt;
        if (b > 255) b = 255;
        else if  (b < 0) b = 0;
        var g = (num & 0x0000FF) + amt;
        if (g > 255) g = 255;
        else if (g < 0) g = 0;
        return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16).padStart(6,'0');
    }

    _generateHTML() {
        this.elem = document.createElement("button");
        this.elem.innerText = this.text;
        if(this.parent) this.parent.appendChild(this.elem);
        this.elem.addEventListener("click", (evt) => {
            evt.preventDefault();
            this.callback(evt);
        });
    }

    _styling() {
        this.elem.style.backgroundColor = this.color;
        this.currentColor = this.color;
        this.elem.style.padding = '.5rem';
        this.elem.style.border = 'none';
        this.elem.style.borderRadius = '.5rem';
        this.elem.style.fontSize = "1rem";
        this.elem.style.cursor = "pointer";
        this._restyle();
    }

    _restyle() {
        this.elem.style.boxShadow = `0 .5rem .1rem ${this._LightenDarkenColor(this.currentColor, -100)}`;
    }

}