export function getMeta(name){
    const meta=document.querySelector(`meta[name="${name}"]`);
    return meta?meta.getAttribute("content"):null;
}

export function modal(content,visible=-1){
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

export function modalById(id,visible=-1){
    modal(document.getElementById(id),visible);
}

export function createElement(type,value=null,options={}){
    try{
        const el=document.createElement(type,options);
        if(value===null) return el;
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
    }catch(ex){
        throw new Error(ex,{cause:ex});
    }
}

export function addClassPresent(item,value){
    if(!item.classList.contains(value)){
        item.classList.add(value);
    }
}

export function removeClassPresent(item,value){
    if(item.classList.contains(value)){
        item.classList.remove(value);
    }
}

export function loadTabContainer(tabs_container){
    const tab_titles=tabs_container.getElementsByClassName('tab-title');
    const tab_items=tabs_container.getElementsByClassName('tab-item');
    const items=[];
    let tab_title_selected=null;
    let index=0;
    for(const tab_title of tab_titles){
        if(tab_title_selected==null && tab_title.hasAttribute("selected")){
            tab_title_selected=tab_title;
        }
        const tab_item=tab_items[index];
        const inputs=tab_item.querySelectorAll(Util.query_element_inputs);
        const item={
            inputs:inputs,
            tab_title:tab_title,
            tab_item:tab_item,
            validityInputs:(input=null)=>{
                let has_count_invalid_inputs=tab_title.hasAttribute("invalid-inputs") && input!=null;
                let count_invalid_inputs=0;
                if(has_count_invalid_inputs){
                    count_invalid_inputs=tab_title.getAttribute("invalid-inputs");
                    if(input.checkValidity()){
                        count_invalid_inputs--;
                    }else{
                        count_invalid_inputs++;
                    }
                }else{
                    for(const input of inputs){
                        if(!input.checkValidity()){
                            count_invalid_inputs++;
                        }
                    }
                }
                tab_title.setAttribute("invalid-inputs",count_invalid_inputs);
                return count_invalid_inputs;
            }
        };
        items.push(item);
        tab_title.addEventListener('click',(evt)=>{
            items.forEach((item)=>{
                item.tab_title.removeAttribute("selected");
                Util.modal(item.tab_item,false);
                item.validityInputs();
            });
            tab_title.setAttribute("selected",true);
            Util.modal(tab_item,true);
        });
        index++;
        for(const input of inputs){
            input.addEventListener('change',(evt)=>{
                //item.validityInputs(input);
                item.validityInputs();
            });
        }
        item.validityInputs();
    }
    if(tab_title_selected!=null){
        tab_title_selected.click();
    }
}

export function jsonViewer(json){
    let element_viewer=Util.createElement('div',(element_viewer)=>{
        element_viewer.classList.add('json-viewer');
    });
    if(json==null) return element_viewer;
    function addItem(element_viewer,json){
        if(Array.isArray(json)){
            let element_array=createElement('div',(element_array)=>{
                element_array.classList.add('json-array');
            })
            for(let item of json){
                Object.entries(item).forEach(([key,value])=>{
                    element_array.appendChild(createElement('div',(element_item)=>{
                        element_item.classList.add('json-item');
                        element_item.appendChild(createElement('div',(item_key)=>{
                            item_key.classList.add('json-key');
                            item_key.textContent=key;
                        }));
                        if(Array.isArray(value)){
                            element_item.appendChild(addItem(element_array,value));
                        }else{
                            element_item.appendChild(createElement('div',(item_value)=>{
                                item_value.classList.add('json-value');
                                item_value.textContent=value;
                            }));
                        }
                    }));
                });
            }
            return element_array;
        }else{
            return element_viewer;	
        }
    }
    element_viewer.appendChild(addItem(element_viewer,json));
    return element_viewer;
}

export default class DOMHelper{

    static getMeta=getMeta;
    static modal=modal;
    static modalById=modalById;
    static createElement=createElement;
    static addClassPresent=addClassPresent;
    static removeClassPresent=removeClassPresent;
    static loadTabContainer=loadTabContainer;
    static jsonViewer=jsonViewer;

}