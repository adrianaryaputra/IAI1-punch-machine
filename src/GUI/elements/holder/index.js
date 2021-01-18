export class Holder{

    constructor({
        parent,
        style = {}
    }){
        this.elem = document.createElement("section");
        this.elem.classList.add("holder");

        for (const key in style) {
            this.elem.style[key] = style[key];
        }

        if(parent) parent.appendChild(this.elem);
    }

    element() {
        return this.elem;
    }

}