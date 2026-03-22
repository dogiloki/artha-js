import Config from "./Config.js";

export default class Util{
    
    static getMeta(name){
        const meta=document.querySelector(`meta[name="${name}"]`);
        return meta?meta.getAttribute("content"):null;
    }

    static getValueByPath(obj,path,default_value=null){
        return path.split(".").reduce((o,p)=>o?o[p]:default_value,obj);
    }

    static modal(content,visible=-1){
        content.style.display=(visible==-1)?
            (content.style.display=="none"?"block":"none")
            :(visible?"block":"none");
        if(visible==-1){
            content.classList.toggle("hidden");
            if(content.hasAttribute("hidden")){
                content.removeAttribute("hidden");
            }
        }else{
            if(visible){
                content.classList.remove("hidden");
                content.removeAttribute("hidden");
            }else{
                content.classList.add("hidden");
                content.setAttribute("hidden","");
            }
        }
    }

    static modalById(id,visible=-1){
        Util.modal(document.getElementById(id),visible);
    }

    static formatMoney(value,options={}){
        const {
            locale=Config.get("locale"),
            currency=Config.get("currency"),
            digits=Config.get("money.digits")
        }=options;
        value=value.toString();
        let amount=Number(value.replace(/[^0-9.]/g,""));
        if(isNaN(amount)){
            return value;
        }
        let minimum=0;
        return new Intl.NumberFormat(locale,{
            style:"currency",
            currency,
            minimum,
            digits
        }).format(amount);
    }

    static numberRandom(min,max){
        return Math.floor(Math.random()*(max-min+1))+min;
    }

    static withinRange(value,min,max){
        return value>=min && value<=max;
    }

    static createElement(type,value=null,options={}){
        const el=document.createElement(type,options);
        if(value!==null){
            return el;
        }
        if(Array.isArray(value)){
            value.forEach((item)=>{
                el.appendChild(item); 
            });
        }else if(typeof value==="function"){
            value(el);
        }else{
            el.textContent=value;
        }
        return el;
    }

}