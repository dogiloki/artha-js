export default class BaseComponent extends HTMLElement{

    static counter=0;

    // Método estático para definir atributos observados
    static get observedAttributes(){
        return [];
    }

    constructor(props=null,options={}){
        super();
        BaseComponent.counter+=1;
        // Cache de elementos DOM referenciados por ID
        this._elements={};
        // Flag para evitar ciclos de actualización
        this._updating=false;
        // Mapeo de atributos
        this._props=[];
        // Mapeo para indicar comportamiento especiales en el mapeo de atributos
        this._special_props={
            booleans:[], // Propiedades booleanas
            element_refs:[], // Propiedades de referencian elementos por ID
            defaults:{}, // Propiedades con valor por defecto
            resolvers:{} // Propiedades con un callback
        };
        this.configureProperties(props,options);
    }

    connectedCallback(){
        this.onConnected();
        this.dispatchEvent(new CustomEvent('component-ready',{
            detail:this,
            bubbles:true
        }));
    }
    onConnected(){}

    disconnectedCallback(){
        this.onDisconnected();
        this.clearElementCache();
    }
    onDisconnected(){}

    attributeChangedCallback(name,old_value,new_value){
        if(old_value===new_value) return;
        if(this._props.includes(name)){
            this._triggerUpdate(name,this._getPropertyValue(name));
        }
        this.onAttributeChanged(name,old_value,new_value);
    }
    onAttributeChanged(name,old_value,new_value){}

    configureProperties(props,options={}){
        if(props==null) return;
        this._props=props;
        this._special_props={
            booleans:options.booleans||[],
            element_refs:options.element_refs||[],
            defaults:options.defaults||{},
            resolvers:options.resolvers||{}
        };
        this._setupProperties();
    }

    _setupProperties(){
        this._props.forEach((prop)=>{
            Object.defineProperty(this,prop,{
                get:()=>this._getPropertyValue(prop),
                set:(value)=>this._setPropertyValue(prop,value),
                enumerable:true,
                configurable:true
            });
        });
        // Iniciar con valores de atributos existentes
        this._initializeProperties();
    }

    _getPropertyValue(prop){
        // Propiedade que referencia un elemento por ID
        if(this._special_props.element_refs.includes(prop)){
            const element_id=this.getAttribute(prop);
            if(!element_id) return null;
            // Cache para evitar múltiples búsquedas en el DOM
            if(!this._elements[prop] || this._elements[prop].id!==element_id){
                this._elements[prop]=document.getElementById(element_id);
            }
            return this._elements[prop];
        }
        // Propiedades con callback
        if(this._special_props.resolvers[prop]){
            const raw_value=this.getAttribute(prop);
            return this._special_props.resolvers[prop].get(raw_value,this);
        }
        // Propiedad booleana
        if(this._special_props.booleans.includes(prop)){
            return this.hasAttribute(prop) && this.getAttribute(prop)!=='false';
        }
        // Propiedad con valor por defecto
        const value=this.getAttribute(prop);
        if(value===null && this._special_props.defaults[prop]!==undefined){
            return this._special_props.defaults[prop];
        }
        return value;
    }

    _setPropertyValue(prop,value){
        if(this._updating) return;
        const current_value=this.getAttribute(prop);
        let new_value=value;
        // Convertir a string para atributos
        if(value===null || value===undefined){
            new_value=null;
        }else if (typeof value==='boolean'){
            new_value=value?'':null;
        }else if(typeof value==='object'){
            // Para objetos como referencia a elementos, no actualizar el atributo
            this._elements[prop]=value;
            this._triggerUpdate(prop,value);
            return;
        }else if(this._special_props.resolvers[prop]){
            new_value=this._special_props.resolvers[prop].set(value,this);
            this._triggerUpdate(prop,value);
        }else{
            new_value=String(value);
        }
        // Solo actualizar si cambió
        if(current_value!==new_value){
            if(new_value===null){
                this.removeAttribute(prop);
            }else{
                this.setAttribute(prop,new_value);
            }
            this._triggerUpdate(prop,value);
        }
    }

    _initializeProperties(){
        this._props.forEach((prop)=>{
            const attrib_value=this.getAttribute(prop);
            if(attrib_value!==null){
                this[prop]=this._getPropertyValue(prop);
            }else if(this._special_props.defaults[prop]!==undefined){
                this[prop]=this._special_props.defaults[prop];
            }
        })
    }

    _triggerUpdate(prop,value){
        if(this._updating) return;
        this._updating=true;
        // Evento específico para cambio de la propiedad
        this.dispatchEvent(new CustomEvent(`${prop}-changed`,{
            detail:{
                property:prop,
                value,
                component:this
            },
            bubbles:true
        }));
        // Evento genérico para cualquier cambio
        this.dispatchEvent(new CustomEvent('property-changed',{
            detail:{
                property:prop,
                value,
                component:this
            },
            bubbles:true
        }));
        // Actualización (puede ser sobrescrito)
        this.onPropertyChanged(prop,value);
        this._updating=false;
    }

    onPropertyChanged(prop,value){

    }

    setProperties(props){
        this._updating=true;
        Object.entries(props).forEach(([key,value])=>{
            if(this._props.includes(key)){
                this[key]=value;
            }
        });
        this._updating=false;
        this._triggerUpdate('batch',props);
    }

    getProperties(){
        const props={};
        this._props.forEach((prop)=>{
            props[prop]=this[prop];
        });
        return props;
    }

    clearElementCache(){
        this._elements={};
    }

}