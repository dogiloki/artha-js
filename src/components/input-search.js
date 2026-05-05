import BaseComponent from '../abstract/BaseComponent.js';
import DOMHelper from "../helpers/DOMHelper.js";

export default class InputSearch extends BaseComponent{

    static defaults={
        delay:300,
        text:'Búscar'
    }
    static SEARCH_MODES=Object.freeze({
        local:'local',
        server:'server'
    });

    constructor(mode_search=null){
        super([
            'delay','text','value','input','button'
        ],{
            element_refs:['input','button'],
            resolvers:{
                'value':{
                    set:(raw)=>{
                        return this.input.value=raw;
                    },
                    get:(raw)=>{
                        return this.input?.value??null;
                    }
                }
            },
            defaults:{
                delay:InputSearch.defaults.delay,
                text:InputSearch.defaults.text
            },
            reflect:{
                text:false,
            }
        });
        this._search_timer=null;
        this._initialized=false;
        this._onInput=(evt=>{
            this._queueSearch();
        });
        this._onKeyDown=(evt=>{
            if(evt.key==='Enter'){
                evt.preventDefault();
                this._cancelQueuedSearch();
                this.search();
            }
        });
        this._onClick=(evt=>{
            evt.preventDefault();
            this._cancelQueuedSearch();
            this.search();
        });
        this.searchMode(InputSearch.SEARCH_MODES.server);
    }

    onConnected(){
        if(this._initialized) return;
        this._ensureStructure();
        this._bindEvents();
        this._initialized=true;
    }

    onDisconnected(){
        this.input?.removeEventListener('input',this._onInput);
        this.input?.removeEventListener('keydown',this._onKeyDown);
        this.button?.removeEventListener('click',this._onClick);
        if(this._search_timer){
            clearTimeout(this._search_timer);
            this._search_timer=null;
        }
        this._initialized=false;
    }

    onAttributeChanged(prop,old_value,new_value){
        if(prop=='search_mode'){
            console.log(new_value);
        }
    }

    searchMode(value){
        this._search_mode=value;
        this.button?.removeEventListener('click',this._onClick);
        if(this._search_mode==InputSearch.SEARCH_MODES.local){
            this._onClick=(evt=>{
                evt.preventDefault();
                this.refresh();
            });
            this.button?.classList.remove(...this.button?.classList);
            this.button?.classList.add("button-refresh");
            const span=this.button?.querySelector("span");
            span?.classList.remove(...span?.classList);
            span?.classList.add("icon","refresh");
        }else if(this._search_mode==InputSearch.SEARCH_MODES.server){
            this._onClick=(evt=>{
                evt.preventDefault();
                this._cancelQueuedSearch();
                this.search();
            });
            this.button?.classList.remove(...this.button?.classList);
            this.button?.classList.add("button-search");
            const span=this.button?.querySelector("span");
            span?.classList.remove(...span?.classList);
            span?.classList.add("icon","search");
        }
        this.button?.addEventListener('click',this._onClick);
    }

    _ensureStructure(){
        this.style.display="flex";
        this.input=this.appendChild(DOMHelper.createElement('input',(input)=>{
            input.classList.add('input-field');
            input.type="search";
            input.placeholder=this.text;
        }));
        this.button=this.appendChild(DOMHelper.createElement('button',(button)=>{
            button.classList.add('button-search');
            button.appendChild(DOMHelper.createElement('span',(span)=>{
                span.classList.add('icon','search');
            }));
        }));
    }

    _bindEvents(){
        this.input.addEventListener('input',this._onInput);
        this.input.addEventListener('keydown',this._onKeyDown);
        this.button.addEventListener('click',this._onClick);
    }

    _queueSearch(){
        this._cancelQueuedSearch();
        this._search_timer=setTimeout(()=>{
            this.search();
            this._search_timer=null;
        },Number(this.delay));
    }

    _cancelQueuedSearch(){
        this.dispatchEvent(new CustomEvent('cancel-search',{
            detail:{
                query:this.value
            },
            bubbles:true
        }));
        if(this._search_timer){
            clearTimeout(this._search_timer);
            this._search_timer=null;
        }
    }

    search(){
        this.dispatchEvent(new CustomEvent('search',{
            detail:{
                query:this.value
            },
            bubbles:true
        }));
    }

    refresh(){
        this.dispatchEvent(new CustomEvent('refresh',{
            detail:{
                query:this.value
            },
            bubbles:true
        }));
    }

}