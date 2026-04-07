import modal from './DOMHelper.js';

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
                modal(item.tab_item,false);
                item.validityInputs();
            });
            tab_title.setAttribute("selected",true);
            modal(tab_item,true);
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

export function sync(element1,element2,{
    event='keyup',
    mutual=false,
    content1={
        event:null
    },
    content2={
        event:null
    }
}={}){
    element1.addEventListener(content1.event??event,(evt)=>{
        element2.value=element1.value;
    });
    if(mutual){
        element2.addEventListener(content2.event??event,(evt)=>{
            element1.value=element2.value;
        });
    }
}

export default class FormHelper{

    static loadTabContainer=loadTabContainer;
    static sync=sync;

}