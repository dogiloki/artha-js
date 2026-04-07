import DOMHelper from '../helpers/DOMHelper.js';
import BaseComponent from '../abstract/BaseComponent.js';

export default class ArthaMessage extends BaseComponent{

    static TYPE=Object.freeze({
        ERROR:{
            code:-1,
            name:"error"
        },
        INFO:{
            code:0,
            name:"info"
        },
        SUCCESS:{
            code:1,
            name:"success"
        },
        WARNING:{
            code:2,
            name:"warning"
        }
    });

    constructor(){
        super();
        this._initialized=false;
    }

    onConnected(){
        if(this._initialized) return;
        this.type=this.getAttribute("type")||ArthaMessage.TYPE.INFO.name;
        this.hidden();
        this._initialized=true;
    }

    onDisconnected(){
        this._initialized=false;
    }

    error(message=null){
        this.show(message,ArthaMessage.TYPE.ERROR);
    }

    info(message=null){
        this.show(message,ArthaMessage.TYPE.INFO);
    }

    success(message=null){
        this.show(message,ArthaMessage.TYPE.SUCCESS);
    }

    warning(message=null){
        this.show(message,ArthaMessage.TYPE.WARNING);
    }

    show(message=null,type=null){
        if(!message || type==null) return this.hidden();
        if(type) this.setAttribute("type",(typeof type==="string"?type:type.name)||ArthaMessage.TYPE.INFO.name);
        if(message) this.innerHTML=message;
        DOMHelper.modal(this,true);
    }

    hidden(){
        DOMHelper.modal(this,false);
    }

}