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
            }
        });
        this._search_timer=null;
        this._ensureStructure();
    }

    _ensureStructure(){
        this.icon=InputSearch.defaults.icon;
        this.style.display="flex";
        this.appendChild(Util.createElement('div',(container)=>{
            container.classList.add('input-container');
            this.input=container.appendChild(Util.createElement('input',(input)=>{
                input.classList.add('input-field');
                input.type="search";
                input.placeholder="";
            }));
            container.appendChild(Util.createElement('label',(label)=>{
                label.classList.add('input-label');
                label.textContent=this.text;
            }));
        }));
        this.button=this.appendChild(Util.createElement('button',async(button)=>{
            button.classList.add('button-search');
            button.appendChild(Util.createElement('span',(span)=>{
                span.classList.add('icon','search');
            }));
        }));
        this._bindEvents();
    }

    _bindEvents(){
        this.input.addEventListener('input',(evt)=>{
            this._queueSearch();
        });
        this.input.addEventListener('keydown',(evt)=>{
            if(evt.key==='Enter'){
                evt.preventDefault();
                this._cancelQueuedSearch();
                this.search();
            }
        });
        this.button.addEventListener('click',(evt)=>{
            evt.preventDefault();
            this._cancelQueuedSearch();
            this.search();
        });
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