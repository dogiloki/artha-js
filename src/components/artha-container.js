import BaseComponent from '../abstract/BaseComponent.js';
import Util from '../core/Util.js';
import EventBus from '../core/EventBus.js';
import XHR from '../core/XHR.js';
import TaskQueue from '../core/TaskQueue.js';
import ArthaMessage from './artha-message.js';

export default class ArthaContainer extends BaseComponent{

    constructor(){
        super(
            ["template","action","action_router","method",
            "pagination","message","searcher","selectable","multiple"],
            {
                booleans:['searcher','selectable','multiple'],
                element_refs:['template','mesage'],
                defaults:{
                    method:'GET',
                    pagination:10
                }
            }
        );

        this.onRenderItem=(element,data)=>{};
        this.onRenderItemFill=(element,data,fill_element,fill_data)=>{};
        this.onRenderItemIter=(element,data,iter_element,iter_data)=>{};

        this.task_queue=TaskQueue.singleton();
        this.items={};
        this.selection_store=new SelectionStore();
        this.response_type='json';
        this.message??=this.querySelector('artha-message')??this.querySelector(this.getAttribute('message-target'))??null;
        this.id=this.getAttribute('id')??'container-'+BaseComponent.counter;

        // Loader
        this.loader_container=this._createLoader();

        // Contenido
        this.content=this.querySelector(':scope > dynamic-content') || this.appendChild(document.createElement('dynamic-content'));
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
        this.task_queue.loadTask(`container-${this.id}`,null,(task)=>{
            XHR.request({
                url:this.action,
                method:this.method,
                headers:{
                    'Accept':'application/json'
                },
                response_type:this.response_type,
                query:Object.keys(query).length?query:{},
                onLoad:(xhr)=>{
                    this.dispatchEvent(new CustomEvent('load',{detail:xhr}));
                },
                onData:(xhr,json)=>{
                    // Respuesta procesada en en formato json
                    task.resolve(xhr,()=>{
                        this.dispatchEvent(new CustomEvent('resolve',{detail:json}));
                        if(json.message){
                            this.message?.show(json.message,json.status);
                        }
                        this.render(json.data);
                    });
                },
                onError:(err)=>{
                    this.message?.error(err??"Error de conexión");
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

    renderItem(data,refresh_children=true,update=null){
        const template=this.template?(this.template.tagName==='TEMPLATE'?this.template.content.cloneNode(true):this.template.cloneNode(true)):this;
        const element=update?update:(this.template?template.children[0]:this);

        const items=this._findWires(update?element:template);
        let index=0;

        for(const item of items){
            const wires=item.getAttribute("data-wire").split(":");
            for(let wire of wires){
                const [attrib_json,attrib_element,attrib_action]=wire.split(":");
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
            if(this.selectable) this._bindSelectable(element,data);
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
            switch(attrib_element.toLowerCase()){
                case 'textcontent': item.textContent=value; break;
                case 'innerhtml': item.innerhtml=value; break;
                case 'boolean':{
                    if(chooser){
                        let applied=false;
                        const templates=item.querySelectorAll('template');
                        for(const template of templates){
                            if(template.getAttribute('data-chooser-value')==value){
                                item.innerHTML="";
                                item.appendChild(template.content.cloneNode(true));
                                applied=true;
                                break;
                            }
                        }
                        if(!applied){
                            const template=item.querySelector('template[data-chooser-default]')?.content?.cloneNode(true)??document.createElement('span');
                            item.innerHTML="";
                            item.appendChild(template);
                        }
                    }else{
                        item.innerHTML="";
                        item.appendChild(Util.createElement('span',(span)=>{
                            span.classList.add('check-cross');
                            if(value){
                                span.classList.add('check-cross-yes');
                                span.textContent="✔";
                            }else{
                                span.classList.add('check-cross-no');
                                span.textContent="✘";
                            }
                        }));
                    }
                    break;
                }
                default: this.setAttribute(attrib_element,value);
            }
        }else{
            if(append) value=item.textContent+value;
            item.textContent=value;
        }
    }

    _bindSelectable(element,data){
        const id=element.dataset.id;
        element.addEventListener('click',(evt)=>{
            if(this.selection_store.has(id)){
                const selection=this.selection_store.remove(id);
                this.dispatchEvent(new CustomEvent('item-deselected',{detail:selection}));
            }else{
                if(!this.multiple) this.reset();
                const selection=this.selection_store.add(id,element,data);
                this.dispatchEvent(new CustomEvent('item-selected',{detail:selection}));
            }
            element.classList.toggle('selected');
        });
        if(this.selection_store.has(id)) element.classList.add('selected');
    }

    _findWires(root){
        const result=[];
        for(const child of root.children){
            if(child instanceof ArthaContainer && child.hasAttribute('data-ignore-wire')) continue;
            if(child.hasAttribute('data-wire')) result.push(child);
            result.push(...this._findWires(child));
        }
        return result;
    }

    selection(){
        return this.selection_store;
    }

    reset(){
        this.selection_store.clear();
        for(const item of this.items){
            item.classList.remove('selected');
        }
    }

}

class SelectionStore{

    constructor(){
        this.values=new Set();
        this.elements=new Map();
        this.data=new Map();
    }

    add(value,element,data){
        this.values.add(value);
        this.elements.set(value,element);
        this.data.set(value,data);
        return {
            value,element,data
        };
    }

    remove(value){
        const sel={value,element:this.elements.get(value),data:this.data.get(value)};
        this.values.delete(value);
        this.elements.delete(value);
        this.data.delete(value);
        return sel;
    }

    clear(){
        this.values.clear();
        this.elements.clear();
        this.data.clear();
        return this;
    }

    has(value){
        return this.values.has(value);
    }

    toValues(){
        return Array.from(this.values);
    }

    toElements(){
        return Array.from(this.elements);
    }

    toData(){
        return Array.from(this.data);
    }

    toArray(){
        return Array.from(this.values).map(v=>({
            value:v,
            element:this.elements.get(v),
            data:this.data.get(v)
        }));
    }

}