//-----------------------------------------------------------------------------
//  Galv's Load Common Event
//-----------------------------------------------------------------------------
//  For: RPGMAKER MV
//  Galv_LoadCommonEvent.js
//-----------------------------------------------------------------------------
//  2017-01-23 - Version 1.0 - release
//-----------------------------------------------------------------------------
// Terms can be found at:
// galvs-scripts.com
//-----------------------------------------------------------------------------

var Imported = Imported || {};
Imported.Galv_LoadCommonEvent = true;

var Galv = Galv || {};              // Galv's main object
Galv.LCE = Galv.LCE || {};          // Galv's stuff


//-----------------------------------------------------------------------------
/*:
 * @plugindesc (v.1.0) Run a common event when the player loads a save file
 * 
 * @author Galv - galvs-scripts.com
 *
 * @param Load Save File Event
 * @desc The common event id ran after a saved game is loaded
 * @default 0
 *
 * @help
 *   Galv's Load Common Event
 * ----------------------------------------------------------------------------
 * Just a simple plugin that allows you to set a common event that is run
 * every time the player loads a save file.
 *
 * The plugin setting 'Load Save File Event' can be used to set the id for the
 * common event you want to run.
 * 
 */

/*:ja
 * @plugindesc (v.1.0) セーブデータをロードする度にコモンイベントを実行します
 *
 * @author Galv - galvs-scripts.com
 *
 * @param Load Save File Event
 * @text ロード時コモンイベント
 * @type common_event
 * @desc セーブデータをロード時に実行されるコモンイベントのID
 * @default 0
 *
 * @help
 * 翻訳:ムノクラ
 * https://fungamemake.com/
 * https://twitter.com/munokura/
 *
 * 元プラグイン:
 * https://galvs-scripts.com/2017/01/23/mv-load-common-event/
 *
 *   Galv's Load Common Event
 * ---------------------------------------------------------------------------
 * セーブデータをロードする度に
 * 実行されるコモンイベントを設定できるシンプルなプラグインです。
 * プラグインパラメーター'Load Save File Event'(ロード時コモンイベント)で
 * 実行するコモンイベントのIDを設定できます。
 *
 */


//-----------------------------------------------------------------------------
//  CODE STUFFS
//-----------------------------------------------------------------------------

(function() {

Galv.LCE.cEventId = PluginManager.parameters('Galv_LoadCommonEvent')["Load Save File Event"];

// SCENE LOAD

Galv.LCE.Scene_Load_onLoadSuccess = Scene_Load.prototype.onLoadSuccess;
Scene_Load.prototype.onLoadSuccess = function() {
	if (Galv.LCE.cEventId) $gameTemp.reserveCommonEvent(Galv.LCE.cEventId); // run common event
	Galv.LCE.Scene_Load_onLoadSuccess.call(this);
};


})();