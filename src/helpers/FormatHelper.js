export function formatMoney(value,options={}){
    const {
        locale=this.defaults.locale,
        currency=this.defaults.currency,
        digits=this.defaults.money.digits,
        style=this.defaults.money.style
    }=options;
    value=value.toString();
    let amount=Number(value.replace(/[^0-9.]/g,""));
    if(isNaN(amount)){
        return value;
    }
    let minimum=0;
    return new Intl.NumberFormat(locale,{
        style:style,
        currency,
        minimum,
        digits
    }).format(amount);
}

export function formatTime(text,quantity=3,str=true){
    let array=text.split(":");
    for(let index=0; index<quantity; index++){
        array[index]??="00";
    }
    return array.slice(0,quantity).join(":")+(str?"hrs":"");
}

export function formatSize(value){
    let units=['B','KB','MB','GB','TB','PT','EB','ZB','YB'];
    let index=0;
    while(value>1024){
        value/=1024;
        index++;
    }
    return Number(value).toFixed(2)+" "+units[index];
}

export default class FormatHelper{

    static formatMoney=formatMoney;
    static formatTime=formatTime
    static formatSize=formatSize;

}