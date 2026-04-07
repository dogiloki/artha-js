export function changeNumberSign(num){
    return (num>0)?-num:num;
}

export function numberChange(actual,min,max,direccion=Util.IZQ){
    if(direccion==Util.IZQ){
        if(actual<max){
            actual++;
        }else{
            actual=min;
        }
    }else
    if(direccion==Util.DER){
        if(actual>min){
            actual--;
        }else{
            actual=max;
        }
    }
    return actual;
}

export function numberRandom(min,max){
    return Math.floor(Math.random()*(max-min+1))+min;
}

export function withinRange(value,min,max){
    return value>=min && value<=max;
}

export default class NumberHelper{

    static changeNumberSign=changeNumberSign;
    static numberChange=numberChange
    static numberRandom=numberRandom;
    static withinRange=withinRange;

}