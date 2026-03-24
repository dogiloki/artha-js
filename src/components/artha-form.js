import BaseComponent from '../abstract/BaseComponent.js';
import Util from '../core/Util.js';
import XHR from '../core/XHR.js';
import TaskQueue from '../core/TaskQueue.js';
import ArthaMessage from './artha-message.js';

export default class ArthaForm extends BaseComponent{
    
    constructor(){
        super();
        this.task_queue=TaskQueue.singleton();
        this.response_type=this.getAttribute('response-type')??'json';
        this.disable_submit=this.hasAttribute('disable-submit');
        this.message=this.querySelector('artha-message')??this.querySelector(this.getAttribute('message-target'))??null;
        if(!this.message){
            this.message=Util.createElement('artha-message');
            this.appendChild(this.message);
        }
        this.element_inputs=[];
        this.ignored_input=[];

        // Cargar inputs iniciales
        this.loadInputs();

        // Interceptar submit
        this.addEventListener('submit',(evt)=>{
            evt.preventDefault();
            if(!this.disable_submit) this.submit();
        });

        // Tecla enter
        this.addEventListener('keydown',(evt)=>{
            if(this.disable_submit && evt.key==='Enter' && evt.target instanceof HTMLInputElement){
                evt.preventDefault();
            }
        });

        this._bindEvents();
    }

    _bindEvents(){
        // Botones
        this.querySelectorAll('button').forEach((btn)=>{
            switch(btn.getAttribute('type')){
                case 'submit': btn.addEventListener('click',(evt)=>this.submit()); break;
                case 'reset': btn.addEventListener('click',(evt)=>this.reset()); break;
                default: btn.addEventListener('click',(evt)=>this.submit());
            }
        });
        this.querySelector('[type="submit"]')?.addEventListener('click',(evt)=>this.submit());
        this.querySelector('[type="reset"]')?.addEventListener('click',(evt)=>this.reset());
    }

    // Cargar inputs dinámicos
    loadInputs(selector="input,select,textarea"){
        this.element_inputs=[];
        this.querySelectorAll(selector).forEach((element)=>{
            const name=element.getAttribute('name');
            if(name){
                this[name]=element;
                this.element_inputs.push(element);
            }
        });
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
            return;
        }
        const form_data={};
        this.element_inputs.forEach((element)=>{
            form_data[element.name]=element.type==='checkbox'?(element.checked?1:0):element.value;
        });
        const action=this.getAttribute('action')??'';
        const method=this.getAttribute('method')??'GET';
        const id=this.getAttribute('id');
        this.task_queue.loadTask(`form-${id}`,null,(task)=>{
            XHR.request({
                url:action,
                method:method,
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
            const element=this[key]??this.querySelector(`[name="${key}"]`);
            if(element) element.value=json[key];
        }
    }

}