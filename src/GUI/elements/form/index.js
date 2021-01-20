export class InputElement{

    constructor({
        parent,
        label = "Unlabeled",
        type = "text",
        placeholder = "",
        selection = [],
        value = [],
        isEditable = true,
        sideButton,
        regParser,
        inputListener,
        focusListener,
        blurListener,
    }){
        this.inputListener = inputListener;
        this.focusListener = focusListener;
        this.blurListener = blurListener;
        this.parent = parent;
        this.strLabel = label;
        this.type = type;
        this.placeholder = placeholder;
        this.sideButton = sideButton;
        this.elem = new Object();
        this.isEditable = isEditable;
        this.selection = selection;
        this.regParser = regParser;

        this._createHTML();
        this._styling();

        if(value.length>0){
            this.set(value);
        }
    }

    element() {
        return this.elem.input
    }

    _styling() {
        this.elem.label.style.fontSize = '1em';
        this.elem.label.style.gridColumn = 1;
        this.elem.label.style.margin = "auto 0";
        if(this.elem.input.length == 1){
            this.elem.input.map((i) => {
                i.style.gridColumnStart = "span 2";
            })
        }
        this.elem.input.map((i) => {
            i.style.fontSize = '2.5rem';
            i.style.padding = '.5rem';
            i.style.border = "none";
            i.style.borderRadius = ".5rem";
        })
    }

    _createHTML(){
        
        this.elem.label = document.createElement('label');
        this.elem.label.textContent = this.strLabel;

        switch (this.type) {
            case "text":
            case "date":
            case "time":
                this.elem.input = [
                    document.createElement('input')
                ];
                this.elem.input[0].setAttribute("type",this.type);
                this.elem.input[0].placeholder = this.placeholder;
                if(this.sideButton) this.elem.input.push(this.sideButton);
                break;
            
            case "list":
                this.elem.input = [
                    document.createElement('input')
                ];
                this.elem.input[0].setAttribute("type","text");
                this.elem.input[0].setAttribute("list", ("autoList-"+this.strLabel).replace(" ","-"));
                // generate datalist
                let dL = document.createElement('datalist');
                dL.setAttribute("id", ("autoList-"+this.strLabel).replace(" ","-"));
                // generate value, append to datalist
                this.selection.forEach(val => {
                    let op = document.createElement("option");
                    op.setAttribute("value", val);
                    dL.appendChild(op);
                });
                this.elem.input[0].appendChild(dL);
                if(this.sideButton) this.elem.input.push(this.sideButton);
                break;

            case "datetime":
                this.elem.input = [
                    document.createElement('input'),
                    document.createElement('input')
                ];
                this.elem.input[0].setAttribute("type","date");
                this.elem.input[0].classList.add("input-double");
                this.elem.input[1].setAttribute("type","time");
                this.elem.input[1].classList.add("input-double");

                break;

            default:
                break;
        }

        if(this.parent) this.parent.appendChild(this.elem.label);
        this.elem.input.forEach(element => {
            if(!this.isEditable) element.setAttribute("disabled","true");
            if(this.inputListener) element.addEventListener("change", this.inputListener);
            if(this.focusListener) element.addEventListener("focus", this.focusListener);
            if(this.blurListener) element.addEventListener("blur", this.blurListener);
            this.parent.appendChild(element)
        });
    }

    parse(){
        if(this.regParser) return (this.get().replace(' ','').match(this.regParser) !== null)
        else return true;
    }

    get(){
        return this.elem.input.map(i => {
            return i.value
        }).join('');
    }

    set(value){
        if(this.type == "datetime"){
            value.forEach((val, idx) => {
                this.elem.input[idx].value = val;
            })
        } else {
            this.elem.input[0].value = value;
        }
    }

    reset(){
        this.elem.input.forEach((_, idx) => {
            this.elem.input[idx].value = ""
        })
    }

}

export class FormElement{

    constructor({
        parent,
        configs = []
    }){
        this.parent = parent;
        this.configs = configs;
        this.elem = new Object();
        this.inputs = new Object();

        this._createHTML();
        this._styling();
    }

    element(){
        return this.elem.holder
    }

    _styling() {
        this.element().style.display = "grid";
        this.element().style.gridTemplateColumns = "auto 35% 35%";
        this.element().style.gap = "var(--normal)";
    }

    _createHTML(){
        this.elem.holder = document.createElement('form');

        this.configs.forEach(config => {
            this.inputs[config.id] = new InputElement({
                parent: this.element(),
                ...config,
            });
        });

        if(this.parent) this.parent.appendChild(this.element());
    }

    get(key){
        if(Array.isArray(key)) return key.map((k) => {return this.inputs[k].get()})
        else if(typeof(key) == "string") return this.inputs[key].get()
        else {
            let ret = new Object();
            for (const key in this.inputs) {
                ret[key] = this.inputs[key].get()
            }
            return ret;
        }
    }

    parse(key){
        if(Array.isArray(key)) return key.map((k) => {return this.inputs[k].parse()})
        else if(typeof(key) == "string") return this.inputs[key].parse()
        else {
            let ret = new Object();
            for (const key in this.inputs) {
                ret[key] = this.inputs[key].parse()
            }
            return ret;
        }
    }

    reset(){
        for (const key in this.inputs) {
            this.inputs[key].reset()
        }
    }

    set(setValueObj){
        for (const key in setValueObj) {
            if(this.inputs[key]){
                this.inputs[key].set(setValueObj[key])
            }
        }
    }

}