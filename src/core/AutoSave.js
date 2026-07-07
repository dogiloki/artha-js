export default class AutoSave{

    static defaults={
        key:"auto-save",
        debounce:300,
        serializer:JSON.stringify,
        parser:JSON.parse,
        onSave:null,
        onLoad:null
    };

    constructor(options={}){
        options={...AutoSave.defaults,...options};
        this.options=options;
        this.map=new Map();
        this.timer=null;
    }

    bind(element,options={}){
        const key=options.key??element.getAttribute('name');
        this.map.set(key,{
            el:element,
            get:options.get || this._defaultGet,
            set:options.set || this._defaultSet,
            events: options.events || ['input','change']
        });
        this._attachListener(key);
        return this;
    }

    _attachListener(key){
        const item=this.map.get(key);
        if(!item) return;
        item.events.forEach((event)=>{
            item.el.addEventListener(event,()=>this.save());
        });
    }

    save(){
        clearTimeout(this.timer);
        this.timer=setTimeout(()=>{
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
        this.map.forEach((item,key)=>{
            if(data[key]===undefined) return;
            item.set(item.el,data[key]);
        });
        this.options.onLoad?.(data);
    }

    clear(){
        localStorage.removeItem(this.options.key);
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