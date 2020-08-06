import Controller from "../../framework/controller/Controller";
import { dataBase } from "../../framework/database/DataBase";
import { resolutionHelper } from "../../framework/adaptor/ResolutionHelper";
import { logicManager } from "./LogicManager";
import { uiManager } from "../../framework/base/UIManager";
import GlobalAudio from "../component/GlobalAudio";
import { assetManager } from "../../framework/assetManager/AssetManager";
import { netManager } from "./NetManager";
import { Config } from "../config/Config";
import { language } from "../../framework/base/Language";
import { LanguageImpl } from "../language/LanguageImpl";
import { getSingleton } from "../../framework/base/Singleton";
import { CommonService } from "../net/CommonService";
import { LobbyService } from "../net/LobbyService";

/**
 * @description 主控制器 
 */

const {ccclass, property,menu} = cc._decorator;

@ccclass
@menu("manager/MainController")
export default class MainController extends Controller<CommonService> {
    
    /**@description 进入后台的时间 */
    private _enterBackgroundTime = 0;

    onLoad () {

        resolutionHelper().onLoad(this.node);

        //语言包初始化
        language().delegate = getSingleton(LanguageImpl);
        
        //本地缓存数据库打开
        dataBase().open();

        //先添加全局的网络组件
        netManager().addNetControllers(this.node);

        //预先加载下loading预置体
        

        //调试按钮事件注册
        let showUI = cc.find("showUI",this.node);
        let showNode = cc.find("showNode",this.node);
        let showRes = cc.find("showRes",this.node);
        if ( showUI && showNode && showRes){
            showUI.zIndex = 9999;
            showNode.zIndex = 9999;
            showRes.zIndex = 9999;
             let isShow = false;
            if ( Config.isShowDebugButton ){
                isShow = true;
                showUI.on(cc.Node.EventType.TOUCH_END,()=>{
                    uiManager().printViews();
                });
                showNode.on(cc.Node.EventType.TOUCH_END,()=>{
                    uiManager().printCanvasChildren();
                });
                showRes.on(cc.Node.EventType.TOUCH_END,()=>{

                });
            }
            showUI.active = isShow;
            showNode.active = isShow;
            showRes.active = isShow;
        }

        //游戏事件注册
        cc.game.on(cc.game.EVENT_HIDE,this.onEnterBackground,this);
        cc.game.on(cc.game.EVENT_SHOW,this.onEnterForgeground,this);

        cc.director.on(cc.Director.EVENT_AFTER_DRAW,this._onDirectorAfterDraw,this);

        //逻辑管理器
        logicManager().onLoad(this.node);
    }

    /**@description 游戏完成一次渲染过程之后 */
    private _onDirectorAfterDraw( ){
        let cando = uiManager().onDirectorAfterDraw();
    }

    update(){

        //大厅网络连接调度
        LobbyService.instance.handMessage();

        //远程资源下载任务调度
        assetManager().remote.update();
    }

    onDestroy(){
        
        resolutionHelper().onDestroy();

        //移除网络组件 
        netManager().removeNetControllers(this.node);
        //移除键盘事件
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP);

        //移除游戏事件注册
        cc.game.off(cc.game.EVENT_HIDE);
        cc.game.off(cc.game.EVENT_SHOW);

        //逻辑管理器
        logicManager().onDestroy(this.node);
    }

    private onEnterBackground(){
        this._enterBackgroundTime = Date.timeNow();
        cc.log(`[MainController]`,`onEnterBackground ${this._enterBackgroundTime}`);
        uiManager().getCanvas().getComponent(GlobalAudio).onEnterBackground();
        this.service && this.service.onEnterBackground();
    }

    private onEnterForgeground(){
        let now = Date.timeNow();
        let inBackgroundTime = now - this._enterBackgroundTime;
        cc.log(`[MainController]`,`onEnterForgeground ${now} background total time : ${inBackgroundTime}`);
        uiManager().getCanvas().getComponent(GlobalAudio).onEnterForgeground(inBackgroundTime);
        this.service && this.service.onEnterForgeground(inBackgroundTime);
    }
}
