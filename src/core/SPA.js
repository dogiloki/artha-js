import DOMHelper from "../helpers/DOMHelper.js";

export default class SPA{

    static defaults={
        menu:null,
        content:null,
        default_key:null
    };

    constructor(options){
        options={...this.defaults,...options};
        const {
            menu,
            content,
            default_key
        }=options;
        this.menu=options.menu;
        this.content=options.content;
        this.default_key=options.default_key;
        this._init();
        this._bindEvents();
    }

    _init(){
        this.routes=Object.fromEntries(
            Array.from(this.menu.querySelectorAll('[key]'))
            .map(el=>[el.getAttribute('key'),el])
        );
        this.contents=Object.fromEntries(
            Array.from(this.content.querySelectorAll('[key]'))
            .map(el=>[el.getAttribute('key'),el])
        );
    }

    _hiddenAll(){
        for(const content of Object.values(this.contents)){
            DOMHelper.modal(content,false);
        }
        for(const route of Object.values(this.routes)){
            route.classList.remove('active');
            route.removeAttribute('selected');
        }
    }

    _bindEvents(){
        for(const route of Object.values(this.routes)){
            route.addEventListener('click',(evt)=>{
                this.select(route.getAttribute('key'));
            });
        }
        if(this.default_key){
            this.select(this.default_key);
            return;
        }
        const selected=this.menu.querySelector('[selected]');
        if(selected){
            this.select(selected.getAttribute('key'));
        }
    }

    hidden(key){
        if(key==null) return;
        DOMHelper.modal(this.contents[key],false);
        const route=this.routes[key];
        route.classList.remove('active');
        route.removeAttribute('selected');
    }

    select(key){
        if(!this.routes[key] || !this.contents[key]) return;
        this._hiddenAll();
        const route=this.routes[key];
        route.classList.add('active');
        route.setAttribute('selected','');
        DOMHelper.modal(this.contents[key]);
    }

}