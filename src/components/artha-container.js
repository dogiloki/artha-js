import Util from '../core/Util.js';
import EventBus from '../core/EventBus.js';
import XHR from '../core/XHR.js';
import TaskQueue from '../core/TaskQueue.js';

export default class ArthaContainer extends HTMLElement{

    constructor(){
        super();

        this.onRenderItem=(element,data)=>{};
        this.onRenderItemFill=(element,data,fill_element,fill_data)=>{};
        this.onRenderItemIter=(element,data,iter_element,iter_data)=>{};

        this.task_queue=TaskQueue.singleton();
        this.items={};
        this.selection_store=new SelectionStore();
        this.response_type='json';
        this._elements={};
        this._props=[
            "template","action","action_router","method",
            "pagination","message","searcher","selectable","multiple"];
        this._props.forEach((prop)=>{
            Object.defineProperty(this,prop,{
                get:()=>{
                    switch(prop){
                        case 'template':
                        case 'message':
                            if(!this._elements[prop] || this._elements[prop].id!==this.getAttribute(prop)){
                                this._elements[prop]=document.getElementById(this.getAttribute(prop));
                            }
                            return this._elements[prop];
                        case 'method': return this._elements[prop];
                        default: return this.getAttribute(prop);
                    }
                },
                set:(value)=>{
                    if(this.getAttribute(prop)!==value){
                        this.setAttribute(prop,value);
                    }
                }
            });
            const attr_val=this.getAttribute(prop);
            if(attr_val!==null) this[prop]=attr_val;
        });
        this.pagination=this.getAttribute("pagination");
        this.searcher=this.hasAttribute("searcher");
        this.selectable=this.hasAttribute("selectable");
        this.multiple=this.hasAttribute("multiple");

        // Loader
        this.loader_container=this._createLoader();

        // Contenido
        this.content=this.querySelector(':scone > dynamic-content') || this.appendChild(document.createElement('dynamic-content'));
        this._content=this.content.children[0];

        // Input de búsqueda
        this.input_search=this.querySelector("input-search");
        if(this.input_search){
            this.input_search.addEventListener('search',(evt)=>this._handleSearch(evt));
            this.refresh(this.input_search.value);
        }else{
            this.refresh();
        }
    }

    _createLoader(){
        return Util.createElement('div',(div)=>{
            div.classList.add('loader-container');
            div.setAttribute('title','Procesando...');
            div.appendChild(Util.createElement('div',(div2)=>{
                div2.classList.add('background-overlay');
            }));
            div.appendChild(Util.createElement('div',(div3)=>{
                div3.classList.add('loader','active');
            }));
            const img_container=div.appendChild(Util.createElement('div',(div4)=>{
                div4.classList.add('img-container');
            }));
            img_container.appendChild(Util.createElement('img',(img)=>{
                img.src='/assets/logo.png';
            }));
        });
    }

    _handleSearch(evt){
        if(this.action){
            this.refresh(evt.detail.query);
        }else{
            const search=evt.detail.query?.toLowerCase()??'';
            for(const item of this.items??[]){
                Util.modal(item,item.textContent.toLowerCase().includes(search));
            }
        }
    }

    // value - getter/setter
    get value(){
        if(!this.selectable) return null;
        return this.multiple?this.selection_store.toValues():this.selection_store.toValues()[0]??null;
    }

    set value(values){
        if(!this.selectable) return;
        if(!Array.isArray(values)) values=[values];

        this.selection_store.clear();
        let count=0;
        for(const item of this.items){
            const id=item.dataset.id;
            if(values.includes(id)){
                this.selection_store.add(id,item,item.data);
                this.classList.add('selected');
                if(!this.multiple && ++count>=1) break;
            }else{
                item.classList.remove('selected');
            }
        }
    }

    connectedCallback(){
        const channels=(this.getAttribute('refresh-on')||'').split(',').map(c=>c.trim()).filter(c=>c.length>0);
        this._refresh_listeners=[];
        for(const channel of channels){
            const listener=(evt)=>evt?.detail?this.refreshWithData(evt.detail):this.refresh();
            EventBus.on(channel,listener);
            this._refresh_listeners.push({channel,listener});
        }
    }

    disconnectedCallback(){
        for(const {channel,listener} of this._refresh_listeners??[]){
            EventBus.off(channel,listener);
        }
    }

    getData(search=null){
        if(!this.action) return;
        const query=search?{search}:{};
        this.task_queue.loadTask(`container-${id}`,null,(task)=>{
            XHR.request({
                url:this.action,
                method:this.method,
                headers:{
                    'Accept':'application/json'
                },
                response_type:this.response_type,
                query:Object.keys(query).length?query:undefined,
                onLoad:(xhr)=>{
                    this.dispatchEvent(new CustomEvent('load',{detail:xhr}));
                },
                onData:(data)=>{
                    // Respuesta procesada en en formato json
                    task.resolve(data,(json)=>{
                        if(Util.withinRange(data.status,200,299)){
                            console.log(data,json);
                        }
                        this.dispatchEvent(new CustomEvent('resolve',{detail:json}));
                    });
                },
                onError:(err)=>{
                    this.message.error(err??"Error de conexión");
                    task.onFinalize();
                }
            });
        },{
            message:this.message
        });
    }

    refresh(search=null){
        this.loader_container.remove();
        if(this.template){
            this.content.innerHTML="";
            if(this._content) this.content.appendChild(this._content);
            this.content.appendChild(this.loader_container);
        }
        this.getData(search);
    }

    refreshWithData(data){
        for(const child of this.content.querySelectorAll('[data-id]')){
            if(child.dataset.id==data.id) this.renderItem(data,true,child);
        }
    }

    render(results,refresh=false,refresh_children=true){
        if(refresh) this.refresh();
        results=Array.isArray(results)?results:[results];
        this.data=results;
        this.items=[];
        this.loader_container.remove();
        for(const data of results) this.renderItem(data,refresh_children);
        this.dispatchEvent(new CustomEvent('dynamic-content-loaded',{detail:results}));
    }

    renderItem(data,refresh_children=true,update=true){
        const template=this.template?(this.template.tagName==='TEMPLATE'?this.template.content.cloneNode(true):this.template.cloneNode(true)):this;
        const element=update??(this.template?template.children[0]:this);

        const items=this._findWires(update?element:template);
        let index=0;

        for(const item of items){
            const wires=item.getAttribute("data-wire").split(",");
            for(let wire of wires){
                const [attrib_json,attrib_element,attrib_action]=wire.split(",");
                let value=attrib_json?Util.getValueByPath(data,attrib_json.replaceAll("[]","")):data[index]??"";
                const append=attrib_action==="append";
                const chooser=attrib_action==="chooser";
                const is_value_array=attrib_json?.endsWith("[]");

                if(item instanceof ArthaContainer) item.render(value,refresh_children);
                else if(is_value_array) this._fillArray(item,append,chooser);
                else this._setValue(item,attrib_element,value,append,chooser);
            }
        }

        if(!update){
            this.items.push(element);
            element.data=data;
            element.dataset.id=data.id;
            if(thgis.selectable) this._bindSelectable(element,data);
        }

        this.onRenderItem(element,data);
        if(this.template && !update) this.content.appendChild(element);
        this.dispatchEvent(new CustomEvent('item-rendered',{detail:{item:element,data,index}}));
        index++;
    }

    _fillArray(item,data,value){
        const fill_template=item.children[0].cloneNode(true);
        item.innerHTML="";
        for(const fill of value??[]){
            const node=fill_template.cloneNode(true);
            const fill_elements=node.querySelectorAll("[fillable]");
            const iter_elements=node.querySelectorAll("[iterable]");
            fill_elements.forEach((element)=>{
                this.onRenderItemFill(item,data,element,fill);
                element.textContent=fill;
                element.value=fill;
            });
            iter_elements.forEach((element)=>{
                this.onRenderItemIter(item,data,element,fill);
            });
            item.appendChild(node);
        }
    }

    _setValue(item,attrib_element,value,append,chooser){
        if(attrib_element){
            if(append){
                switch(attrib_element){
                    case 'textcontent': value=item.textContent+value; break;
                    case 'innerhtml': value=item.innerhtml+value; break;
                    default: value=item.getAttribute(attrib_element)+value;
                }
            }
        }
    }

}