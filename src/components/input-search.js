import BaseComponent from '../abstract/BaseComponent.js';
import Util from "../core/Util.js";

export default class InputSearch extends BaseComponent{

    static defaults={
        delay:300,
        text:'Búscar',
        icon:'../dist/assets/icons/search.svg'
    }

    constructor(){
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
                text:false
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

    _ensureStructure(){
        this.icon=InputSearch.defaults.icon;
        this.style.display="flex";
        this.input=this.appendChild(Util.createElement('input',(input)=>{
            input.classList.add('input-field');
            input.type="search";
            input.placeholder=this.text;
        }));
        this.button=this.appendChild(Util.createElement('button',(button)=>{
            button.classList.add('button-search');
            button.appendChild(Util.createElement('span',(span)=>{
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

}