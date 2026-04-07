import DOMHelper  from "../../helpers/DOMHelper.js";

export default class LoaderBase{

    constructor(type,text){
        this.type=type;
        this.text=text;
    }

    renderType(){
        return DOMHelper.createElement('div',(div)=>{
            div.classList.add('loader-content');
        });
    }

    renderLoader=(loader)=>{
        loader.appendChild(document.createElement('div'));
    }

    renderText(){
        return DOMHelper.createElement('span',this.text);
    }

    render(){
        let loader=this.renderType();
        this.renderLoader(loader);
        return [loader,this.renderText()];
    }

}