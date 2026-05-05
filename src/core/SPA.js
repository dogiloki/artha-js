import DOMHelper from "../helpers/DOMHelper.js";

export default class SPA{

    static defaults={
        menu:null,
        content:null
    };

    constructor(options){
        options={...this.defaults,...options};
        const {
            menu,
            content
        }=options;
        this.menu=options.menu;
        this.content=options.content;
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
        this._hiddenAll();
    }

    _hiddenAll(){
        for(const content of Object.values(this.contents)){
            DOMHelper.modal(content,false);
        }
        for(const route of Object.values(this.routes)){
            route.classList.remove('active');
        }
    }

    _bindEvents(){
        for(const route of Object.values(this.routes)){
            route.addEventListener('click',(evt)=>{
                this._hiddenAll();
                route.classList.add('active');
                DOMHelper.modal(this.contents[route.getAttribute('key')]);
            });
        }
    }

}