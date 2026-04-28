import DOMHelper from '../helpers/DOMHelper.js';
import BaseComponent from '../abstract/BaseComponent.js';
import XHR from '../core/XHR.js';
import TaskQueue from '../core/TaskQueue.js';
import EventBus from '../core/EventBus.js';

export default class ArthaForm extends BaseComponent{
    
    static defaults={
        response_type:'json'
    };

    constructor(){
        super([
            'action','method','response_type','disable_submit'
        ],{
            booleans:['disable_submit'],
            defaults:{
                'response_type':ArthaForm.defaults.response_type
            },
            reflect:{
                response_type:false
            }
        });
        this.task_queue=TaskQueue.singleton();
        this.message=null;
        this.element_inputs=[];
        this.ignored_input=[];
        this._initialized=false;

        this._onSubmit=(evt)=>{
            evt.preventDefault();
            if(!this.disable_submit) this.submit();
        };
        this._onKeyDown=(evt)=>{
            if(this.disable_submit && evt.key==='Enter' && evt.target instanceof HTMLInputElement){
                evt.preventDefault();
            }
        };
    }

    onConnected(){
        if(this._initialized) return;

        this.message=this.querySelector('artha-message')??this.querySelector(this.getAttribute('message-target'))??null;
        if(!this.message){
            this.message=DOMHelper.createElement('artha-message');
            this.appendChild(this.message);
        }

        // Cargar inputs iniciales
        this.loadInputs();

        // Interceptar submit
        this.addEventListener('submit',this._onSubmit);
        // Tecla enter
        this.addEventListener('keydown',this._onKeyDown);

        this._bindEvents();
        this._initialized=true;
    }

    onDisconnected(){
        this.removeEventListener('submit',this._onSubmit);
        this.removeEventListener('keydown',this._onKeyDown);
    }

    _bindEvents(){
        // Botones
        this.querySelectorAll('button').forEach((btn)=>{
            switch(btn.getAttribute('type')){
                case 'submit': btn.addEventListener('click',(evt)=>this.submit()); break;
                case 'reset': btn.addEventListener('click',(evt)=>this.reset()); break;
            }
        });
        this.querySelector('[type="submit"]')?.addEventListener('click',(evt)=>this.submit());
        this.querySelector('[type="reset"]')?.addEventListener('click',(evt)=>this.reset());
    }

    // Cargar inputs dinámicos
    loadInputs(selector="input,select,textarea,artha-select,[selectable]"){
        this.element_inputs=[];
        this.querySelectorAll(selector).forEach((element)=>{
            const name=element.getAttribute('name');
            if(name){
                this[name]=element;
                this.element_inputs.push(element);
            }
            if(element.tagName.toLowerCase()==='select'){
                const channels=(element.getAttribute('refresh-on')||'').split(',').map(c=>c.trim()).filter(c=>c.length>0);
                this._refresh_listeners=[];
                for(const channel of channels){
                    const listener=(evt)=>evt?.detail?this.loadInputsSelect(element,evt.detail):this.loadInputsSelect(element);
                    EventBus.on(channel,listener);
                    this._refresh_listeners.push({channel,listener});
                }
                this.loadInputsSelect(element);
            }
        });
    }

    loadInputsSelect(element,data=null){
        element.innerHTML="";
        const action=element.getAttribute('action')??null;
        if(!action) return;
        const artha_container=document.createElement('artha-container');
        const option=document.createElement('option');
        option.value=-1;
        option.textContent=TaskQueue.defaults.title;
        element.appendChild(option);
        artha_container.id=crypto.randomUUID();
        artha_container.action=action;
        artha_container.method=element.getAttribute('method')??'GET';
        artha_container.addEventListener('message-rendered',(evt)=>{
            const {message,status}=evt.detail;
            option.textContent=message;
        });
        artha_container.addEventListener('resolve',(evt)=>{
            const json=evt.detail;
            if(json.data){
                element.innerHTML="";
                json.data.forEach((item)=>{
                    const option=document.createElement('option');
                    option.value=item.id;
                    option.textContent=item.show;
                    element.appendChild(option);
                });
            }
        });
        if(data){
            data=Array.isArray(data)?data:[data];
            data.forEach((item)=>{
                const option=document.createElement('option');
                option.value=item.id;
                option.textContent=item.show;
                element.appendChild(option);
            });
        }else{
            artha_container.refresh();
        }
    }

    // Obtener valor de un input por el atributo name
    getValue(name){
        const element=this[name]??this.querySelector(`[name="${name}"]`);
        return element?(element.type==='checkbox'?(element.checked?1:0):element.value):null;
    }
    input(name){
        const element=this.querySelector(`[name="${name}"]`);
        if(element!=null && !(name in this)){
            this[name]=element;
        }
        return element;
    }

    // Reset general del formulario
    reset(reset_message=true){
        this.element_inputs.forEach((element)=>{
            if(element.type==='checkbox') element.checked=false;
            else element.value='';
        });
        if(reset_message) this.resetMessage();
    }

    // Reset al mensaje (ocultar)
    resetMessage(){
        if(this.message) this.message.hidden();
    }

    // Validar formulario
    checkValidity(){
        let valid=true;
        for(const element of this.element_inputs){
            if(typeof element.checkValidity==='function' && !element.checkValidity()){
                valid=false;
                break;
            }
        }
        return valid;
    }

    // Enviar formulario
    submit(){
        if(!this.checkValidity()){
            this.message.warning('Formulario incompleto');
            this.dispatchEvent(new CustomEvent('load',{detail:null}));
            return;
        }
        const form_data={};
        this.element_inputs.forEach((element)=>{
            let value=element.type==='checkbox'?(element.checked?1:0):element.value;
            // Normalizar null
            if(value==="null" || value===null){
                value="";
            }
            form_data[element.name]=value;
        });
        const id=this.getAttribute('id');
        this.task_queue.loadTask(`form-${id}`,null,(task)=>{
            XHR.request({
                url:this.action,
                method:this.method,
                data:form_data,
                response_type:this.response_type,
                onLoad:(xhr)=>{
                    this.dispatchEvent(new CustomEvent('load',{detail:xhr}));
                },
                onData:(xhr,json)=>{
                    // Respuesta procesada en formato json
                    task.resolve(xhr,()=>{
                        this.dispatchEvent(new CustomEvent('resolve',{detail:json}));
                        this.fillFromJson(json.data??{},false);
                    });
                },
                onError:(err)=>{
                    this.message.error(err??"Error de conexión");
                    task.onFinalize();
                }
            })
        },{
            message:this.message
        });
    }

    // Llenar inputs desde un JSON
    fillFromJson(json,reset=true){
        if(reset) this.reset(false);
        for(const key in json){
            const element=this.querySelector(`[name="${key}"]`);
            if(element) element.value=json[key];
        }
    }

}