import DOMHelper from '../helpers/DOMHelper.js';
import BaseComponent from '../abstract/BaseComponent.js';

export default class ArthaCollapsible extends BaseComponent{

    constructor(){
        super();
        this.header=this.firstElementChild;
        this.header_icon=DOMHelper.createElement('span',(span)=>{
            span.innerHTML="▶";
        });
        this.content=this.children[1];
        this.header.appendChild(this.header_icon);
        this.toggle(false);
        this._bindEvents();
    }

    _bindEvents(){
        this.header.addEventListener('click',(evt)=>{
            this.toggle();
        });
    }

    toggle(is_open=null){
        is_open??=this.classList.toggle('open');
        this.header_icon.innerHTML=is_open?"▼":"▶";
        this.content.style.maxHeight=(is_open?this.content.scrollHeight:"0")+"px";
    }

}