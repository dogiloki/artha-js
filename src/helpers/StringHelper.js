export function convertText(texto){
    return texto.codePointAt(0)-64;
}

export function convertNum(num){
    return String.fromCodePoint(num+64);
}

export default class StringHelper{

    static convertText=convertText;
    static convertNum=convertNum;

}