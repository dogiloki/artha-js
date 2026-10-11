import DataHelper from '../helpers/DataHelper.js';
import DOMHelper from '../helpers/DOMHelper.js';
import BaseComponent from '../abstract/BaseComponent.js';
import EventBus from '../core/EventBus.js';
import XHR from '../core/XHR.js';
import TaskQueue from '../core/TaskQueue.js';
import InputSearch from '../components/input-search.js';

export default class ArthaContainer extends BaseComponent{

    static formAssociated=true;
    static defaults={
        method:'GET',
        pagination:10,
        pagination_options:"10,25,50,100",
        page:1,
        response_type:'json'
    };
    static inicial_requests=new Map();

    constructor(){
        super(
            ["template","action","action_router","method","page","search","name","search_mode","pagination_options",
            "pagination","message","searcher","selectable","multiple","response_type","manual","reuse-request"],
            {
                booleans:['searcher','selectable','multiple','manual'],
                element_refs:['template','message'],
                defaults:{
                    response_type:ArthaContainer.defaults.response_type,
                    method:ArthaContainer.defaults.method,
                    search_mode:InputSearch.SEARCH_MODES.server,
                    pagination_options:ArthaContainer.defaults.pagination_options
                },
                resolvers:{
                    pagination_options:{
                        get:value=>value.split(",").map(Number),
                        set:value=>Array.isArray(value)?value.join(","):value
                    }
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
        this.items=[];
        this.selection_store=new SelectionStore();
        this._initialized=false;
        this._onRefresh=(evt)=>this._handleRefresh(evt);
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
            this.searcher_input.addEventListener('component-ready',()=>{
                this.searcher_input.searchMode(this.search_mode);
            });
            this.prepend(this.searcher_input);
            this.searcher_input.addEventListener('refresh',this._onRefresh);
            this.searcher_input.addEventListener('search',this._onSearch);
            this.searcher_input.addEventListener('cancel-search',this._onCancelSearch);
            this.addEventListener('search_mode-changed',(evt)=>{
                //this.searcher_input.searchMode(evt.detail.value);
            });
        }

        // Contenido
        this.content=this.querySelector(':scope > dynamic-content') || this.appendChild(document.createElement('dynamic-content'));
        this._content=this.content.children[0];
        if(this.hasPagination()){
            this.pagination_container=DOMHelper.createElement('nav',(nav)=>{
                nav.className='artha-pagination';
                nav.setAttribute('aria-label','Paginación');
            });
            this.insertBefore(this.pagination_container,this.content);
        }
        if(this.hasAction() && !this.manual){
            const search=this.search?this.searcher_input.value:null;
            const group=this.getAttribute('reuse-request');
            if(group){
                const key=JSON.stringify({
                    group,
                    action:this.action,
                    method:this.method,
                    pagination:this.hasPagination()?this.pagination:null,
                    page:this.hasPagination()?this.page:null,
                    search,
                    response_type:this.response_type
                });
                this._shared_initial_key=key;
                const cached=ArthaContainer.inicial_requests.get(key);
                if(cached){
                    if(cached.status==='resolved'){
                        this.render(cached.data);
                    }else{
                        cached.waiters.push(this);
                    }
                }else{
                    ArthaContainer.inicial_requests.set(key,{
                        status:'pending',
                        data:null,
                        waiters:[]
                    });
                    this._is_shared_initial_loader=true;
                    this.refresh(search);
                }
            }else{
                this.refresh(search);
            }
        }else if(this.search_mode==InputSearch.SEARCH_MODES.local){
            this.refresh(this.searcher_input.value);
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

    _handleRefresh(evt){
        if(this.hasAttribute('action')){
            this.search=evt.detail.query;
            this.refresh();
        }
    }

    _handleSearch(evt){
        this.page=1;
        if(this.hasAction()){
            this.search=evt.detail.query;
            return this.refresh();
        }else{
            const search=evt.detail.query?.toLowerCase()??'';
            for(const item of this.items){
                DOMHelper.modal(item,item.textContent.toLowerCase().includes(search));
            }
        }
    }

    _cancelSearch(){
        this._current_xhr?.abort();
        this._current_xhr=null;
    }

    _clearSharedInitialRequest(){
        const key=this._shared_initial_key;
        if(!this._is_shared_initial_loader || !key) return;
        const cached=ArthaContainer.inicial_requests.get(key);
        if(cached?.status==='pending'){
            ArthaContainer.initial_requests.delete(key);
            for(const container of cached.waiters){
                container.renderMessage('No se pudo cargar los datos','error');
            }
        }
        this._is_shared_initial_loader=false;
    }

    _renderPagination(meta){
        const nav=this.pagination_container;
        if(!nav || !meta) return;
        nav.replaceChildren();
        const current=Number(meta.current_page);
        const last=Number(meta.last_page);
        if(!Number.isInteger(current) || !Number.isInteger(last) || last<1) return;
        // Información de los registros
        const info=DOMHelper.createElement('span',(span)=>{
            span.className='artha-pagination-info';
            span.textContent=meta.total>0?`Mostrando ${meta.from}-${meta.to} de ${meta.total} registros`:`Sin registros`;
        });
        const pagination_select=DOMHelper.createElement('select',(select)=>{
            select.className='artha-pagination-select';
            const options=meta.pagination_options??this.pagination_options;
            options.forEach(size=>{
                const option=DOMHelper.createElement('option',(option)=>{
                    option.value=size;
                    option.textContent=`${size} por página`;
                    option.selected=Number(size)===Number(this.pagination);
                    select.appendChild(option);
                });
                select.addEventListener('change',()=>{
                    this.pagination=Number(select.value);
                    this.page=1;
                    this.refresh(this.search);
                });
            });
        });

        const controls=DOMHelper.createElement('div',(div)=>{
            div.className='artha-pagination-controls';
        });
        const addButton=(label,page,options={})=>{
            const button=DOMHelper.createElement('button');
            button.type='button';
            button.textContent=label;
            button.className='artha-pagination-button';
            if(options.active){
                button.classList.add('active');
                button.setAttribute('aria-current','page');
            }
            button.disabled=options.disabled??false;
            if(Number.isInteger(page)){
                button.dataset.page=page;
            }
            controls.appendChild(button);
        };
        addButton('<',current-1,{
            disabled:current<=1
        });
        addButton('1',1,{
            active:current===1
        });
        // Páginas cercanas a la actual
        const start=Math.max(2,current-1);
        const end=Math.min(last-1,current+2);
        if(start>2){
            const dots=DOMHelper.createElement('span',(span)=>{
                span.textContent="...";
            });
            controls.appendChild(dots);
        }
        for(let page=start; page<=end; page++){
            addButton(String(page),page,{
                active:page===current
            });
        }
        if(end<last-1){
            const dots=DOMHelper.createElement('span',(span)=>{
                span.textContent="...";
            });
            controls.appendChild(dots);
        }
        // Última página, sin duplicar la primera
        if(last>1){
            addButton(String(last),last,{
                active:current>=last
            });
        }
        addButton('>',current+1,{
            disabled:current>=last
        });
        // Un solo listener por contenedor
        if(!this._pagination_click_handler){
            this._pagination_click_handler=(evt)=>{
                const button=evt.target.closest('button[data-page]');
                if(!button || !nav.contains(button) || button.disabled) return;
                this.goToPage(Number(button.dataset.page));
            };
            nav.addEventListener('click',this._pagination_click_handler);
        }
        const page_info=DOMHelper.createElement('span',(span)=>{
            span.className='artha-pagination-page-info';
            span.textContent=`Página ${current} de ${last}`;
        });
        nav.append(info,pagination_select,controls,page_info);
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

    setIdSelected(id,selected){
        const item=this.items.find(item=>item.dataset.id==id);
        if(!item) return this;
        this.setItemSelected(item,selected);
    }

    setItemSelected(item,selected=false){
        const id=item.dataset.id;
        if(selected){
            if(!this.multiple){
                this.reset();
            }
            this.selection_store.add(id,item,item.data);
            item.classList.add('selected');
        }else{
            this.selection_store.remove(item.dataset.id);
            item.classList.remove('selected');
        }
        return this;
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
                        const key=this._shared_initial_key;
                        if(this._is_shared_initial_loader && key){
                            const cached=ArthaContainer.inicial_requests.get(key);
                            if(cached){
                                cached.status='resolved';
                                cached.data=json.data;
                                for(const container of cached.waiters){
                                    if(container.isConnected){
                                        container.render(json.data);
                                        if(container.hasPagination()){
                                            container._renderPagination(json.meta);
                                        }
                                    }
                                }
                                cached.waiters.length=0;
                            }
                            this._is_shared_initial_loader=false;
                        }
                        this.render(json.data);
                        if(this.hasPagination()){
                            this._renderPagination(json.meta);
                        }
                    });
                },
                onError:(err)=>{
                    this._clearSharedInitialRequest();
                    this.renderMessage(err??"Error de conexión","error");
                    task.onFinalize();
                    this._cancelSearch();
                },
                onAbort:(err)=>{
                    this._clearSharedInitialRequest();
                    task.onFinalize();
                    this._cancelSearch();
                }
            });
        },{
            message:this.message
        });
    }

    hasAction(){
        return this.hasAttribute('action') && this.search_mode==InputSearch.SEARCH_MODES.server;
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
        this._cancelSearch();
        page=Number(page);
        if(!this.hasPagination() || !Number.isInteger(page) || page<1) return;
        this.page=page;
        this.pagination_container.querySelectorAll('button[data-page]').forEach(button=>{
            if(Number(button.dataset.page)===page){
                button.classList.add('active');
                button.setAttribute('aria-current','page');
            }else{
                button.classList.remove('active');
                button.removeAttribute('aria-current');
            }
        });
        return this.refresh(this.search);
    }

    resetPagination(refresh=false){
        this.page=1;
        if(refresh) return this.refresh(this.search);
    }

    refresh(search=null){
        this._cancelSearch();
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
            if(child.dataset.id==data.id) this.renderItem(data,true,child,true);
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

    renderItem(data,refresh_children=true,update=null,prepend=false){
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
        if(this.template && !update){
            if(prepend){
                this.content.prepend(element);
            }else{
                this.content.appendChild(element)
            }
        }
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