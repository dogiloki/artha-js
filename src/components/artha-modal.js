import DataHelper from '../helpers/DataHelper.js';
import DOMHelper from '../helpers/DOMHelper.js';
import BaseComponent from '../abstract/BaseComponent.js';

export default class ArthaModal extends BaseComponent{

    static get observedAttributes(){
        return ['open','title'];
    }

    constructor(){
        super(['open','title'],{
            booleans:['open']
        });
        this._initialized=false;
        this._last_focus_element=null;
        this._title_id=`artha-modal-${BaseComponent.counter}-title`;
        this._onKeyDown=(event)=>{
            if(event.key==='Escape' && this.closeOnEscape()){
                this.hide('escape');
            }
        };
    }

    onConnected(){
        if(!this._initialized){
            this._render();
            this._initialized=true;
        }
        this._syncVisibility();
    }

    onDisconnected(){
        document.removeEventListener('keydown',this._onKeyDown);
    }

    onPropertyChanged(property){
        if(!this._initialized) return;
        if(property==='open') this._syncVisibility();
        if(property==='title') this._syncTitle();
    }

    _render(){
        const content=document.createDocumentFragment();
        while(this.firstChild) content.appendChild(this.firstChild);
        
        this.classList.add('artha-modal');
        this.setAttribute('role','dialog');
        this.setAttribute('aria-modal','true');

        this.dialog=document.createElement('section');
        this.dialog.className='artha-modal__dialog';
        this.dialog.setAttribute('role','document');

        this.header=document.createElement('div');
        this.header.className='artha-modal__header';
        this.title_element=document.createElement('h2');
        this.title_element.className='artha-modal__title';
        this.header.appendChild(this.title_element);

        this.close_btn=document.createElement('button');
        this.close_btn.className='artha-modal__close';
        this.close_btn.type='button';
        this.close_btn.innerHTML='&times;';
        this.close_btn.addEventListener('click',()=>this.hide('button'));
        this.header.appendChild(this.close_btn);

        this.body=document.createElement('div');
        this.body.className='artha-modal__body';
        this.body.appendChild(content);
        this.dialog.append(this.header,this.body);
        this.appendChild(this.dialog);

        this.addEventListener('click',(event)=>{
            if(event.target===this && this.closeOnBackdrop()){
                this.hide('backdrop');
            }
        })
        this._syncTitle();
    }

    _syncTitle(){
        const title=this.title||'';
        this.title_element.textContent=title;
        this.header.hidden=!title && this.hasAttribute('no-close');
        this.close_btn.hidden=this.hasAttribute('no-close');
        if(title){
            this.title_element.id=this.id?`${this.id}.title`:this._id_title;
            this.setAttribute('arial-labelledby',this.title_element.id);
        }else{
            this.removeAttribute('arial-labelledby');
        }
    }

    _syncVisibility(){
        const is_open=this.open;
        this.hidden=!is_open;
        this.setAttribute('aria-hidden',String(!is_open));
        document.removeEventListener('keydown',this._onKeyDown);
        if(is_open){
                document.addEventListener('keydown',this._onKeyDown);
                requestAnimationFrame(()=>this.close_btn.hidden || this.close_btn.focus());
        }
    }

    closeOnBackdrop(){
        return !this.hasAttribute('no-close-backdrop');
    }

    closeOnEscape(){
        return !this.hasAttribute('no-close-escape');
    }

    show(){
        if(this.open) return this;
        this._last_focus_element=document.activeElement;
        if(!this.dispatchEvent(new CustomEvent('modal-show',{
            bubbles:true,
            cancelable:true
        }))) return this;
        this.open=true;
        this.dispatchEvent(new CustomEvent('modal-shown',{
            bubbles:true
        }));
        return this;
    }

    hide(reason='api'){
        if(!this.open) return this;
        if(!this.dispatchEvent(new CustomEvent('modal-hide',{
            detail: {reason},
            bubbles:true,
            cancelable:true
        }))) return this;
        this.open=false;
        this._last_focus_element?.focus?.();
        this.dispatchEvent(new CustomEvent('modal-hidden',{
            detail:{reason},
            bubbles:true
        }));
        return this;
    }

    toggle(){
        return this.open?this.hide('toggle'):this.show();
    }

}