export class Table{

    constructor({
        parent,
        header,
        contentSize = 0,
        autonum = true,
    }){
        this.header = header;
        this.parent = parent;
        this.autonum = autonum;
        this.content = new Array();
        this.elem = new Object();
        this.elem.holder = document.createElement('table');
        this.elem.holder.classList.add('table-default');
        if(this.parent) this.parent.appendChild(this.element());

        this.elem.header = document.createElement('thead');
        this.element().appendChild(this.elem.header);

        this.elem.header_tr = document.createElement('tr');
        this.elem.header.appendChild(this.elem.header_tr);

        if(this.autonum){
            let thnum = document.createElement('th');
            thnum.textContent = "No."
            this.elem.header_tr.appendChild(thnum);
        }

        this.header.forEach(head => {
            let th = document.createElement('th');
            th.textContent = head;
            this.elem.header_tr.appendChild(th);
        })

        this.elem.body = document.createElement('tbody');
        this.element().appendChild(this.elem.body);

        for (let cS = 0; cS < contentSize; cS++) {
            let row = document.createElement('tr');
            this.content.push(row);
        }
    }

    element(){
        return this.elem.holder;
    }

    update({rowArray = [], contentArray = []}){
        if(rowArray.length == contentArray.length) {
            rowArray.forEach((rowNumber,index) => {
                let tr = this.content[rowNumber];
                tr.innerHTML = '';

                if(this.autonum) {
                    let tnum = document.createElement('td');
                    tr.appendChild(tnum);
                }

                contentArray[index].forEach((value) => {
                    let td = document.createElement('td');
                    td.textContent = value;
                    tr.appendChild(td);
                });
            });
        } else {
            console.error("table edit input have different size")
        }

        this.elem.body.innerHTML = '';
        this.content.forEach(content => {
            this.elem.body.appendChild(content);
        });
    }

    add(content = []){
        let tr = document.createElement('tr');
        if(this.autonum) {
            let tnum = document.createElement('td');
            tr.appendChild(tnum);
        }
        content.forEach(c => {
            let td = document.createElement('td');
            td.textContent = c;
            tr.appendChild(td);
        })
        this.bodyElem.appendChild(tr);
    }

}