import LoaderBase from './LoaderBase.js';

export default class LoaderDots extends LoaderBase{

    renderLoader=(loader)=>{
        loader.appendChild(document.createElement('div'));
        loader.appendChild(document.createElement('div'));
        loader.appendChild(document.createElement('div'));
    };

}