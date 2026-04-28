import DOMHelper from '../helpers/DOMHelper.js';
import ArthaForm from '../components/artha-form.js';

export default class ArthaField extends ArthaForm{

    constructor(){
        super();
        super.onConnected();
        this.mode_edition=false;
        this.original_value=null;
        this._initialized_artha_field=false;
    }

    onConnected(){
        if(this._initialized_artha_field) return;

        // Obtener referencias de los elementos
        this.field_value=this.querySelector('[field-value]');
        let attribute=this.field_value.getAttribute('field-value').split(":");
        this.field_value_name=attribute[0];
        this.field_value_attrib=attribute[1]??"value";
        this.field_input=this.querySelector("[name='"+this.field_value_name+"']");

        // Guardar valor original
        this.original_value=this.field_value.textContent;
        this.changeValue(this.original_value);

        // Agregar elementos
        this.button_edit=DOMHelper.createElement('button',(button)=>{
            button.textContent="✏️";
            button.classList.add('field-button','edit-button');
            button.addEventListener('click',(evt)=>{
                evt.preventDefault();
                this.modeEdition(true);
            });
        });
        this.button_save=DOMHelper.createElement('button',(button)=>{
            button.textContent="💾";
            button.classList.add('field-button','save-button');
            button.addEventListener('click',(evt)=>{
                evt.preventDefault();
                this.save();
            });
        });
        this.button_cancel=DOMHelper.createElement('button',(button)=>{
            button.textContent="❌";
            button.classList.add('field-button','cancel-button');
            button.addEventListener('click',(evt)=>{
                evt.preventDefault();
                this.modeEdition(false);
            });
        });
        this.addEventListener('load',(evt)=>{
            this.button_edit.classList.remove('hidden');
            this.button_save.classList.remove('hidden');
            this.button_cancel.classList.remove('hidden');
        });
        this.modeEdition(false);
        this.field_value.parentElement.appendChild(this.button_edit);
        this.field_value.parentElement.appendChild(this.button_save);
        this.field_value.parentElement.appendChild(this.button_cancel);
        this._initialized_artha_field=true;
    }

    changeValue(new_value){
        if(!this.field_input) return;
        if(this.field_input.tagName=="SELECT"){
            this.field_input[this.field_value_attrib]=new_value;
            new_value=this.field_input.querySelector(`option[value="${new_value}"]`)?.textContent??new_value;
        }else if(this.field_input.tagName==="ARTHA-CONTAINER"){
            new_value=this.field_input.querySelector('.selected')?.textContent??new_value;
        }else{
            this.field_input[this.field_value_attrib]=new_value;
        }
        this.field_value.textContent=(new_value=="" || new_value==null)?"---":new_value;
    }

    modeEdition(active){
        this.mode_edition=active;
        DOMHelper.modal(this.field_value,!active);
        DOMHelper.modal(this.field_input,active);
        DOMHelper.modal(this.button_edit,!active);
        DOMHelper.modal(this.button_save,active);
        DOMHelper.modal(this.button_cancel,active);
    }

    save(){
        this.original_value=this.field_input[this.field_value_attrib];
        this.changeValue(this.original_value);
        this.modeEdition(false);
        this.button_edit.classList.add('hidden');
        this.button_save.classList.add('hidden');
        this.button_cancel.classList.add('hidden');
        this.submit();
    }

}