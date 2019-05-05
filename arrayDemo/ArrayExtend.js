class ArrayExtend extends Array{

  last(){
    return this[this.length-1]
  }
}

let test = new ArrayExtend();

let a = [1,2];

a.slice()