export class Indicator{

    constructor({
        parent,
        text = '',
        colorFalse = '#f00',
        colorTrue = '#0f0',
        style,
    }) {
        this.elem = document.createElement("div");
        this.elem.textContent = text;
        
        for (const key in style) {
            this.elem.style[key] = style[key];
        }

        this.colorTrue = colorTrue;
        this.colorFalse = colorFalse;

        if(parent) parent.appendChild(this.elem);

        this.set(false);
    }

    set(value){
        if(value) this.elem.style.backgroundColor = this.colorTrue;
        else this.elem.style.backgroundColor = this.colorFalse;
    }

}