module.exports = class DataState {

    constructor(stateHandle) {
        this.stateHandle = stateHandle;
        this.state = new Object();
    }

    update(newStates) {
        if(typeof(newStates) == 'object') {
            for (const key in newStates) {
                switch(typeof(newStates[key])) {
                    case 'object':
                        this._updateStateArray(key, newStates[key]);
                        break;
                    default:
                        this._updateStatePrimitive(key, newStates[key]);
                }
            }
        } else {
            console.error("state must be an object. we have: ", typeof newStates, newStates);
        }
    }

    _updateStateArray(newStateKey, newStateValue) {
        // filter the damn data
        if (newStateValue === undefined) return
        if (newStateValue === null) return

        if(Array.isArray(newStateValue)) {
            
            // serialize array / object
            let serOld = JSON.stringify(this.state[newStateKey]);
            let serNew = JSON.stringify(newStateValue);

            if (serOld != serNew) {
                // change it
                this.state[newStateKey] = newStateValue;
                // call the handle
                this.stateHandle[newStateKey](
                    this.state[newStateKey]
                )
            }

            // let similar = true;
            // if(this.state[newStateValue] == undefined) similar = false;
            // else if(newStateValue.length == this.state[newStateValue].length) {
            //     similar = (
            //         newStateValue.filter((val, idx) => {
            //             return JSON.stringify(val) == JSON.stringify(this.state[newStateKey][idx])
            //         }).length == 0
            //     )
            // } 
            // else similar = false;
            // if(!similar) {
            //     // change it
            //     this.state[newStateKey] = newStateValue;
            //     // call the handle
            //     this.stateHandle[newStateKey](
            //         this.state[newStateKey]
            //     )
            // }
            // return
        }

    }

    _updateStatePrimitive(newStateKey, newStateValue) {
        // filter the damn data
        if (newStateValue === undefined) return
        if (newStateValue === null) return

        // if there is change
        if (this.state[newStateKey] != newStateValue) {
            // change it
            this.state[newStateKey] = newStateValue;
            // call the handle
            this.stateHandle[newStateKey](
                this.state[newStateKey]
            )
        }
    }

}