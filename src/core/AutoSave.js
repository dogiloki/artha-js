export default class AutoSave{

    static defaults={
        key:"auto-save",
        debounce:300,
        serializer:JSON.stringify,
        parser:JSON.parse,
        server:{},
        onSave:null,
        onLoad:null,
        onChange:null,
        onValidate:null,
        onEmpty:null,
        onValid:null,
        onChanged:null,
        onStateChange:null,
        classes:{
            empty:"input-empty",
            valid:"input-valid",
            changed:"input-changed"
        }
    };

    constructor(options={}){
        options={...AutoSave.defaults,...options};
        this.options=options;
        this.map=new Map();
        this.save_timer=null;
        this.validation_timer=null;
        this.restoring=false;
        this._last_state=null;
    }

    set(key,value){
        const item=this.map.get(key);
        if(!item) return;
        item.set(item.el,value);
        item.el.dispatchEvent(new Event('input',{bubbles:true}));
    }

    setServerData(data={}){
        this.options.server=data || {};
        this.validate();
        return this;
    }

    getField(key){
        const item=this.map.get(key);
        if(!item) return;
        const value=item.get(item.el);
        const server=this.options.server[key];
        const state=this._validateState(key,value);
        return {
            key,
            element:item.el,
            value,
            server,
            state,
            valid:state==="valid",
            changed:state==="changed",
            empty:state==="empty"
        }
    }

    getDirtyFields(){
        const dirty={};
        this.map.forEach((item,key)=>{
            if(this._validateState(key,item)==="changed"){
                dirty[key]=this.getField(key);
            }
        });
        return dirty;
    }

    getCleanFields(){
        const clean={};
        this.map.forEach((item,key)=>{
            if(this._validateState(key,item)!=="changed"){
                clean[key]=this.getField(key);
            }
        });
        return clean;
    }

    getDiff(){
        const diff={};
        this.map.forEach((item,key)=>{
            const local=item.get(item.el);
            const server=this.options.server[key];
            const changed=String(local??"")!==String(server??"");
            if(changed){
                diff[key]={local,server,changed};
            }
        });
        return diff;
    }

    getState(key){
        return this.getField(key)?.state??null;
    }

    bind(element,options={}){
        const key=options.key??element.getAttribute('name');
        const events=options.events??['input','change'];
        this.map.set(key,{
            el:element,
            get:options.get || this._defaultGet,
            set:options.set || this._defaultSet,
            events:Array.isArray(events)?events:[events]
        });
        this._attachListener(key);
        return this;
    }

    unbind(key){
        this.map.delete(key);
        return this;
    }

    load(){
        const raw=localStorage.getItem(this.options.key);
        if(!raw) return;
        let data;
        try{
            data=this.options.parser(raw);
        }catch(ex){
            console.warn('Storage corrupto');
            return;
        }
        this.restoring=true;
        this.map.forEach((item,key)=>{
            if(data[key]===undefined) return;
            item.set(item.el,data[key]);
            item.el.dispatchEvent(new Event('input',{bubbles:true}));
            item.el.dispatchEvent(new Event('change',{bubbles:true}));
        });
        this.restoring=false;
        if(Object.keys(data).length>0){
            this.validate();
        }
        this.options.onLoad?.(data);
    }

    save(){
        clearTimeout(this.save_timer);
        this.save_timer=setTimeout(()=>{
            const data={};
            this.map.forEach((item,key)=>{
                data[key]=item.get(item.el);
            });
            localStorage.setItem(
                this.options.key,
                this.options.serializer(data)
            );
            this.options.onSave?.(data);
        },this.options.debounce);
    }

    clear(){
        localStorage.removeItem(this.options.key);
        this.map.clear();
        this._last_state=null;
    }

    restoreFromServer(){
        this.restoring=true;
        this.map.forEach((item,key)=>{
            const value=this.options.server[key];
            item.set(item.el,value??"");
        });
        this.restoring=false;
        this.validate();
        return this;
    }

    restoreFieldFromServer(key){
        const item=this.map.get(key);
        if(!item) return;
        this.restoring=true;
        const value=this.options.server[key];
        item.set(item.el,value??"");
        this.restoring=false;
        this.validate(key);
        return this;
    }

    isValid(key){
        return this.getState(key)==="valid";
    }

    isChanged(key){
        return this.getState(key)==="changed";
    }

    isEmpty(key){
        return this.getState(key)==="empty";
    }

    getFormState(){
        return this._getState();
    }

    isDirty(){
        return this.getFormState().dirty;
    }

    isClean(){
        return this.getFormState().clean;
    }

    validate(key=null,tigger=null){
        if(key){
            const item=this.map.get(key);
            if(item){
                this._validateState(key,item);
            }
        }else{
            this.map.forEach((item,key)=>{
                this._validateState(key,item);
            });
        }
        this._notifyState(tigger);
        return this;
    }

    debug(){
        return {
            config:this.options,
            fields:Array.from(this.map.entries()).map(([key,item])=>{
                return {
                    key,
                    element:item.el,
                    value:item.get(item.el),
                    server:this.options.server[key],
                    state:this._validateState(key,item)
                }
            }),
            state:this._getState(),
            storage:this.options.parser(localStorage.getItem(this.options.key)||'{}')
        };
    }

    _setState(el,state){
        const c=this.options.classes;
        el.classList.remove(c.empty,c.valid,c.changed);
        el.classList.add(c[state]);
    }

    _getState(){
        let empty=0;
        let valid=0;
        let changed=0;
        this.map.forEach((item,key)=>{
            switch(this._validateState(key,item)){
                case "empty": empty++; break;
                case "valid": valid++; break;
                case "changed": changed++; break;
            }
        });
        return {
            total: this.map.size,
            empty,
            valid,
            changed,
            dirty:changed>0,
            clean:changed===0
        };
    }

    _notifyState(tigger=null){
        const new_state=this._getState();
        // Solo notificar si el estado cambió
        if(JSON.stringify(new_state)!==JSON.stringify(this._last_state)){
            this._last_state={...new_state};
            this.options.onStateChange?.(new_state,tigger);
        }
    }

    _attachListener(key){
        const item=this.map.get(key);
        if(!item) return;
        item.events.forEach((event)=>{
            item.el.addEventListener(event,()=>{
                if(this.restoring) return;
                const value=item.get(item.el);
                this.options.onChange?.({key,element:item.el,value});
                this._queueValidation(key,{
                    key,
                    element:item.el,
                    value,
                    event
                });
                this.save();
            });
        });
    }

    _queueValidation(key,data){
        clearTimeout(this.validation_timer);
        this.validation_timer=setTimeout(()=>{
            this.validate(key,data);
        },this.options.debounce);
    }

    _validateState(key,item){
        const value=item.get(item.el);
        const server=this.options.server[key];
        const server_empty=server===null || server===undefined || server==="";
        let state;
        if(server_empty){
            state=value===null || value===undefined || value===""?"empty":"changed"
        }else{
            state=String(value??"")===String(server)?"valid":"changed";
        }
        this._setState(item.el,state);
        const data={
            key,
            element:item.el,
            value,
            server,
            state
        };
        this.options.onValidate?.(data);
        switch(state){
            case "empty": this.options.onEmpty?.(data); break;
            case "valid": this.options.onValid?.(data); break;
            case "changed": this.options.onChanged?.(data); break;
        }
        return state;
    }

    _defaultGet(el){
        switch(el.type){
            case 'checkbox': return el.checked;
            case 'radio': return el.checked?el.value:null;
            default: return el.value; 
        }
    }

    _defaultSet(el,value){
        switch(el.type){
            case 'checkbox':{
                el.checked=Boolean(value);
                break;
            }
            case 'radio':{
                el.checked=el.value===value;
                break;
            }
            default:{
                el.value=value??'';
            }
        }
    }

}