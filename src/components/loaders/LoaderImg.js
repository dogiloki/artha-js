import LoaderBase from './LoaderBase.js';
import Util  from "../../core/Util.js";

export default class LoaderImg extends LoaderBase{

    renderLoader=(loader)=>{
        loader.appendChild(Util.createElement('img',(img)=>{
            img.src=this.src;
        }));
    };

}