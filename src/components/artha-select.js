import DOMHelper from '../helpers/DOMHelper.js';
import BaseComponent from '../abstract/BaseComponent.js';
import TaskQueue from '../core/TaskQueue.js';

export default class ArthaSelect extends BaseComponent{

    static formAssociated=true;
    static defaults={
        method:'GET'
    };

    constructor(){
        super([
            'required','readonly','multiple','disabled','action','method','name'
        ],{
            booleans:['required','readonly','multiple','disabled']
        });
        this._internals=this.attachInternals();
        this.options=[];
        this.selected_options={};
        this._initialized=false;
    }

    onConnected(){
        if(this._initialized) return;
        this.options=[...this.querySelectorAll('option')];
        if(this.action){
            this.method??=ArthaSelect.defaults.method;
            this.render();
        }else{
            this._bindEvents();
            this._syncInitialSelection();
            this._syncFormValue();
            this.updateValidity();
        }
        this._initialized=true;
    }

    get value(){
        const array=this.selection();
        if(array.length<=0) return this.multiple?[]:null;
        return this.multiple?array:array[0];
    }
    
    set value(val){
        if(this.multiple){
            this.reset(false);
            const values=Array.isArray(val)?val:[val];
            for(const option of this.options){
                if(values.includes(option.value)) this.select(option,false);
            }
            this._syncFormValue();
            this.updateValidity();
        }else{
            const option=this.options.find(option=>option.value==val);
            if(option){
                this.select(option);
            }else{
                this.reset();
            }
        }
    }

    _bindEvents(){
        for(const option of this.options){
            if(option.hasAttribute('selected')) this.select(option,false);
            if(option._artha_bound) continue;
            option._artha_bound=true;
            option.addEventListener('click',(evt)=>{
                evt.preventDefault();
                if(this.isSelect(option)){
                    this.deselect(option);
                }else{
                    this.select(option);
                }
            });
        }
    }

    _syncInitialSelection(){
        // Se removio la logina al inicio del for en _bindEvents
    }

    _syncFormValue(){
        if(this.multiple){
            const form_data=new FormData();
            for(const value of this.selection()){
                form_data.append(this.name,value);
            }
            this._internals.setFormValue(form_data);
        }else{
            this._internals.setFormValue(this.value??'');
        }
    }

    _loadOptions(options){
        this.innerHTML="";
        this.options=[];
        this.selected_options={};
        for(const option of options){
            const element=this.renderOption(option);
            if(element==null) continue;
            this.appendChild(element);
            this.options.push(element);
        }
        this._bindEvents();
        this._syncInitialSelection();
        this._syncFormValue();
        this.updateValidity();
    }

    selection(){
        return Object.keys(this.selected_options??{});
    }

    isSelect(option){
        return !!option &&
        option.hasAttribute('selected') &&
        this.selected_options.hasOwnProperty(option.value);
    }

    select(option,emit=true){
        if(!option || this.disabled || this.readonly) return null;
        if(!this.multiple){
           this.reset(false);
        }
        this.selected_options[option.value]=option;
        option.setAttribute('selected','selected');
        this._syncFormValue();
        this.updateValidity();
        if(emit){
            this.dispatchEvent(new CustomEvent('select',{detail:{
                value:option.value,
                option:option
            }}));
            this.dispatchEvent(new Event('input',{bubbles:true}));
            this.dispatchEvent(new Event('change',{bubbles:true}));
        }
        return option;
    }

    deselect(option,emit=true){
        if(!option || this.disabled || this.readonly) return;
        delete this.selected_options[option.value];
        option.removeAttribute('selected');
        this._syncFormValue();
        this.updateValidity();
        if(emit){
            this.dispatchEvent(new CustomEvent('deselect',{detail:{
                value:option.value,
                option:option
            }}));
            this.dispatchEvent(new Event('input',{bubbles:true}));
            this.dispatchEvent(new Event('change',{bubbles:true}));
        }
    }

    reset(emit=true){
        for(const option of this.options){
            option.removeAttribute('selected');
        }
        this.selected_options={};
        this._syncFormValue();
        this.updateValidity();
        if(emit){
            this.dispatchEvent(new CustomEvent('reset'));
            this.dispatchEvent(new Event('input',{bubbles:true}));
            this.dispatchEvent(new Event('change',{bubbles:true}));
        }
    }

    updateValidity(){
        const has_value=this.multiple?
        this.selection().length>0:
        !!this.value;
        if(this.required && !has_value){
            this._internals.setValidity(
                {valueMissing:true},
                'Este campo es obligatorio'
            );
        }else{
            this._internals.setValidity({});
        }
    }

    checkValidity(){
        return this._internals.checkValidity();
    }

    reportValidity(){
        return this._internals.reportValidity();
    }

    setCustomValidity(message){
        if(message){
            this._internals.setValidity(
                {customError:true},
                message
            );
        }else{
            this.updateValidity();
        }
    }

    formResetCallback(){
        this.reset(false);
    }

    formDisabledCallback(disabled){
        if(disabled){
            this.setAttribute('disabled','');
        }else{
            this.removeAttribute('disabled');
        }
    }

    renderOption(data){
        return DOMHelper.createElement('option',(element)=>{
            element.value=data.id;
            element.textContent=data.show;
        });
    }

    render(data=null){
        if(data!=null){
            this._loadOptions(data);
            return;
        }
        if(!this.action) return;
        this.innerHTML="";
        this.readonly=true;
        const artha_container=document.createElement('artha-container');
        const option=document.createElement('option');
        option.value=-1;
        option.textContent=TaskQueue.defaults.title;
        this.appendChild(option);
        artha_container.id=crypto.randomUUID();
        artha_container.action=this.action;
        artha_container.method=this.method;
        artha_container.addEventListener('message-rendered',(evt)=>{
            this.readonly=false;
            const {message,status}=evt.detail;
            option.textContent=message;
        });
        artha_container.addEventListener('resolve',(evt)=>{
            this.readonly=false;
            const json=evt.detail;
            if(json.data){
                this._loadOptions(json.data);
            }
        });
        artha_container.refresh();
    }

}