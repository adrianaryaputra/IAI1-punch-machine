export class MessageViewer{

    constructor({
        parent,
        message = "No Error",
    }={}){
        this.parent = parent;
        this.message = message;
        this._generateHTML();
    };

    element() {
        return this.holder;
    }

    _generateHTML() {
        this.holder = document.createElement("section");
        this.holder.style.zIndex = "999";
        this.elemMessage = document.createElement("h3");
        this.holder.appendChild(this.elemMessage);
        this.elemClose = document.createElement("div");
        this.holder.appendChild(this.elemClose);
        this.elemClose.classList = "plus alt clickable";
        this.elemClose.style.width = "1em";
        this.elemClose.style.height = "1em";
        this._styling();
        this.hide();

        if(this.parent) this.parent.appendChild(this.holder);
    }

    _styling() {
        this.holder.style.position = "fixed";
        this.holder.style.bottom = "0";
        this.holder.style.left = "0";
        this.holder.style.right = "0";
        this.holder.style.backgroundColor = "#F00";
        this.holder.style.color = "#000";
        this.holder.style.margin = "1em";
        this.holder.style.padding = "1em";
        this.holder.style.borderRadius = "1em";
        this.holder.style.display = "flex";
        this.holder.style.justifyContent = "space-between";
        this.holder.style.boxShadow = "0 0 1em #000";

        this.elemMessage.style.fontSize = "1em";

        this.elemClose.style.height = "1em";
        this.elemClose.style.width = "1em";
        this.elemClose.style.transform = "rotate(45deg)";

        this.elemClose.addEventListener("click", () => {this.hide()});
    }

    error(msg, timeout=1){
        this.holder.style.backgroundColor = "#F00";
        this.elemMessage.textContent = msg;
        this.show();
        setTimeout(() => this.hide(), timeout*1000)
    }

    success(msg, timeout=1){
        this.holder.style.backgroundColor = "#0F0";
        this.elemMessage.textContent = msg;
        this.show();
        setTimeout(() => this.hide(), timeout*1000)
    }

    warning(msg, timeout=1){
        this.holder.style.backgroundColor = "#FF0";
        this.elemMessage.textContent = msg;
        this.show();
        setTimeout(() => this.hide(), timeout*1000)
    }

    show(){
        this.holder.style.display = "flex";
    }

    hide(){
        this.holder.style.display = "none";
    }

}