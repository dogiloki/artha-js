import DataHelper from '../helpers/DataHelper.js';
import DOMHelper from '../helpers/DOMHelper.js';
import BaseComponent from '../abstract/BaseComponent.js';
import EventBus from '../core/EventBus.js';
import XHR from '../core/XHR.js';
import TaskQueue from '../core/TaskQueue.js';

export default class ArthaContainer extends BaseComponent{

    static formAssociated=true;
    static defaults={
        method:'GET',
        pagination:10,
        page:1,
        response_type:'json'
    };

    constructor(){
        super(
            ["template","action","action_router","method","page","search","name",
            "pagination","message","searcher","selectable","multiple","response_type"],
            {
                booleans:['searcher','selectable','multiple'],
                element_refs:['template','message'],
                defaults:{
                    response_type:ArthaContainer.defaults.response_type,
                    method:ArthaContainer.defaults.method
                },
                reflect:{
                    search:false,
                    response_type:false
                }
            }
        );

        this.onRenderItem=(element,data)=>{};
        this.onRenderItemFill=(element,data,fill_element,fill_data)=>{};
        this.onRenderItemIter=(element,data,iter_element,iter_data)=>{};

        this.task_queue=TaskQueue.singleton();
        this._current_xhr=null;
        this.items={};
        this.selection_store=new SelectionStore();
        this._initialized=false;
        this._onSearch=(evt)=>this._handleSearch(evt);
        this._onCancelSearch=(evt)=>this._cancelSearch(evt);
    }

    onConnected(){
        if(this._initialized) return;

        this.message??=this.querySelector('artha-message')??this.querySelector(this.getAttribute('message-target'))??null;
        this.id=this.getAttribute('id')??'container-'+BaseComponent.counter;
        if(this.hasPagination()){
            this.pagination=this.pagination||ArthaContainer.defaults.pagination;
            this.page=this.page||ArthaContainer.defaults.page;
        }
        if(this.hasAction()){
            this.method=this.method||ArthaContainer.defaults.method;
        }

        // Loader
        this.loader_container=this._createLoader();

        // Input de búsqueda
        if(this.searcher){
            this.searcher_input=DOMHelper.createElement('input-search');
            this.appendChild(this.searcher_input);
            this.searcher_input.addEventListener('search',this._onSearch);
            this.searcher_input.addEventListener('cancel-search',this._onCancelSearch);
        }

        // Contenido
        this.content=this.querySelector(':scope > dynamic-content') || this.appendChild(document.createElement('dynamic-content'));
        this._content=this.content.children[0];

        if(this.hasAction()){
            if(this.searcher){
                this.refresh(this.searcher_input.value);
            }else{
                this.refresh();
            }
        }

        const channels=(this.getAttribute('refresh-on')||'').split(',').map(c=>c.trim()).filter(c=>c.length>0);
        this._refresh_listeners=[];
        for(const channel of channels){
            const listener=(evt)=>evt?.detail?this.refreshWithData(evt.detail):this.refresh();
            EventBus.on(channel,listener);
            this._refresh_listeners.push({channel,listener});
        }

        this._initialized=true;
    }

    onDisconnected(){
        for(const {channel,listener} of this._refresh_listeners??[]){
            EventBus.off(channel,listener);
        }
        this.searcher_input?.removeEventListener('search',this._onSearch);
        this.searcher_input?.removeEventListener('cancel-search',this._onCancelSearch);
        this._current_xhr?.abort();
        this._current_xhr=null;
    }

    _createLoader(){
        return DOMHelper.createElement('artha-loader');
    }

    _handleSearch(evt){
        this.page=1;
        if(this.action){
            this.search=evt.detail.query;
            return this.refresh();
        }else{
            const search=evt.detail.query?.toLowerCase()??'';
            for(const item of this.items){
                DOMHelper.modal(item,item.textContent.toLowerCase().includes(search));
            }
        }
    }

    _cancelSearch(evt){
        this._current_xhr?.abort();
        this._current_xhr=null;
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
                item.classList.add('selected');
                if(!this.multiple && ++count>=1) break;
            }else{
                item.classList.remove('selected');
            }
        }
    }

    router(id){
        this.action=this.action_router.replaceAll('__ID__',id);
        return this;
    }

    getData(search=null){
        search??=this.search;
        if(!this.action) return;
        let query={};
        if(this.hasPagination()){
            query={
                pagination:this.pagination,
                page:this.page
            };
        }
        if(search){
            query['search']=search;
        }
        return this.task_queue.loadTask(`container-${this.id}`,null,(task)=>{
            this._current_xhr=XHR.request({
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
                    this._current_xhr=null;
                    // Respuesta procesada en en formato json
                    task.resolve(xhr,()=>{
                        this.dispatchEvent(new CustomEvent('resolve',{detail:json}));
                        if(json.message){
                            this.renderMessage(json.message,json.status);
                        }
                        this.render(json.data);
                    });
                },
                onError:(err)=>{
                    this.renderMessage(err??"Error de conexión","error");
                    task.onFinalize();
                    this._cancelSearch();
                },
                onAbort:(err)=>{
                    task.onFinalize();
                    this._cancelSearch();
                }
            });
        },{
            message:this.message
        });
    }

    hasAction(){
        return this.hasAttribute('action');
    }

    hasPagination(){
        return this.hasAttribute('pagination');
    }

    nextPage(){
        if(!this.hasPagination()) return;
        this.page+=1;
        return this.refresh(this.search);
    }

    prevPage(){
        if(!this.hasPagination()) return;
        if(this.page>1){
            this.page-=1;
        }
        return this.refresh(this.search);
    }

    goToPage(page){
        page=Number(page);
        if(!this.hasPagination() || !Number.isInteger(page) || page<1) return;
        this.page=page;
        return this.refresh(this.search);
    }

    resetPagination(refresh=false){
        this.page=1;
        if(refresh) return this.refresh(this.search);
    }

    refresh(search=null){
        search??=this.search;
        if(this.loader_container) this.loader_container.remove();
        if(this.template){
            this.content.innerHTML="";
            if(this._content) this.content.appendChild(this._content);
            if(this.loader_container) this.content.appendChild(this.loader_container);
        }
        return this.getData(search);
    }

    refreshWithData(data){
        if(!data) return;
        for(const child of this.content.querySelectorAll('[data-id]')){
            if(child.dataset.id==data.id) this.renderItem(data,true,child);
        }
    }

    render(results,refresh=false,refresh_children=true){
        if(!results) return;
        if(refresh) this.refresh();
        results=Array.isArray(results)?results:[results];
        this.data=results;
        this.items=[];
        if(this.loader_container) this.loader_container.remove();
        for(const data of results) this.renderItem(data,refresh_children);
        this.dispatchEvent(new CustomEvent('dynamic-content-loaded',{detail:results}));
    }

    renderItem(data,refresh_children=true,update=null){
        if(!data) return;
        const template=this.template?(this.template.tagName==='TEMPLATE'?this.template.content.cloneNode(true):this.template.cloneNode(true)):this;
        const element=update?update:(this.template?template.children[0]:this);

        const items=this._findWires(update?element:template);
        let index=0;

        for(const item of items){
            const wires=item.getAttribute("data-wire")
                            .split(",")
                            .map(w=>w.trim())
                            .filter(w=>w.length>0);
            for(let wire of wires){
                const [attrib_json,attrib_element,attrib_action]=wire.split(":");
                let value=attrib_json?DataHelper.getValueByPath(data,attrib_json.replaceAll("[]","")):data[index]??"";
                const append=attrib_action==="append";
                const chooser=attrib_action==="chooser";
                const is_array=Array.isArray(value);
                const is_plain_array=is_array && value.every(v=>typeof v!=='object' || v===null);

                if(item.matches("artha-container")){
                    if(typeof item.render==='function'){
                        item.render(value,false,refresh_children);
                    }else{
                        item.addEventListener('component-ready',()=>{
                            item.render(value,false,refresh_children);
                        },{
                            once:true
                        });
                    }
                }else if(is_plain_array){
                    this._fillArray(item,data,value);
                }else{
                    this._setValue(item,attrib_element,value,append,chooser);
                }
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

    renderMessage(message,status="info"){
        if(this.message) this.message.show(message,status);
        this.dispatchEvent(new CustomEvent('message-rendered',{detail:{message,status}}));
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
                        item.appendChild(DOMHelper.createElement('span',(span)=>{
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
                default: item.setAttribute(attrib_element,value);
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
            if(child.matches('artha-container') && child.hasAttribute('data-ignore-wire')) continue;
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