class RightMenu{
  constructor(param){
    this.targetId = param.targetId
    this.ele = document.querySelector('#' + this.targetId)
    console.assert(this.ele != null, '未找到id=' + this.targetId + '的元素')
    this.menu = null
    this.menuItems = param.menuItems
    this._menuItems = {}
    this.itemDefaultClass = 'item-default'
    this.event = {
      itemClick: null,
      createBefore: null
    }
    this.flag = true
    this.init()
  }

  init(){
    let that = this
    that.createMenu()
    this.ele.oncontextmenu = function(ee) {
      let e = ee || window.event;
      //鼠标点的坐标
      let oX = e.clientX;
      let oY = e.clientY;
      //菜单出现后的位置
      that.menu.style.display = "block";
      that.menu.style.left = oX + "px";
      that.menu.style.top = oY + "px";
      that.createMenu()
      //阻止浏览器默认事件
      return false;//一般点击右键会出现浏览器默认的右键菜单，写了这句代码就可以阻止该默认事件。
    }
    document.oncontextmenu = function(ee){
      let e = ee || window.event;
      if(e.target.id !== that.targetId && e.target.dataset.type != 'item'){
        that.menu.style.display = "none"
      }
    }
    document.onclick = function(ee) {
      let e = ee || window.event;
      that.menu.style.display = "none"
    }
    that.menu.onclick = function(ee) {
      let e = ee || window.event;
      if(e.target.dataset.type == 'item'){
        if(that.event.itemClick instanceof Function){
          that.event.itemClick(that._menuItems[e.target.id])
        }
      }
      e.cancelBubble = true;
    }
    this.menu.onmouseover = function(ee){
      that.flag = true
    }
    this.menu.onmouseleave = function(ee){
      that.flag = false
    }
  }
  createMenu(){
      if(this.menu == null){
        this.menu = document.createElement('div')
        this.menu.innerText = 'sss'
        this.menu.className = 'menu-default'
        document.body.appendChild(this.menu)
      }


      let mark = true
      if(this.event.createBefore instanceof Function){
        mark = this.event.createBefore()
      }
      if(mark){
        this.creatItem()
      }
  }
  _bindOncontextmenu(obj){
    obj.oncontextmenu = function(ee){
     ee.target.click()
     return false
    }
  }
  creatItem(){
    if(this.menuItems.length == 0){
      return
    }
    let fragement = document.createDocumentFragment()
    let temp = null
    let tempItem = null
    for (let i = 0, len = this.menuItems.length; i < len; i++){
      tempItem = this.menuItems[i]
      if(tempItem.show === false){
        continue
      }
      temp = document.createElement('div')
      temp.id = tempItem.id
      temp.innerHTML = tempItem.text
      temp.className = tempItem.style || 'item-default'
      temp.dataset.type = 'item'

      this._menuItems[tempItem.id] = tempItem
      fragement.appendChild(temp)
      this._bindOncontextmenu(temp)
    }
    this.menu.innerHTML = ''
    this.menu.appendChild(fragement)
  }

  on(type,event){
    this.event[type] = event
  }

  hide(){
    this.menu.style.display = 'none'
  }

  setItems(items){
    console.log(11)
    this.menuItems = items
    this.creatItem()
  }
}
let items = [
  {
    id: 'a',
    text: 'b',
    show: true,

  },
  {
    id: 'aa',
    text: 'bb',
  },
  {
    id: 'aaa',
    text: 'bbb',
    show: false,
  },
]
let items1 = [
  {
    id: 'aa',
    text: 'ccc',
    show: true,
    active: false,
    style: 'item-unactive'
  },
  {
    id: 'aav',
    text: 'bfff',
  },
  {
    id: 'aaa',
    text: 'bbdddb',
  },
]
let rightMenu = new RightMenu({
  targetId:'menu',
  menuItems: items
})
rightMenu.on('itemClick',(param) => {
  console.log(param)
  if(param.active === false){
    return
  }
  alert(JSON.stringify(param))
  // rightMenu.hide()
})
rightMenu.on('createBefore',(param) => {
  rightMenu.setItems(items1)
})
