//=============================================================================
// KZR_EnemyLevel2.js
// Version : 1.01
// -----------------------------------------------------------------------------
// [Homepage]: かざり - ホームページ名なんて飾りです。偉い人にはそれがわからんのですよ。 -
//             http://nyannyannyan.bake-neko.net/
// -----------------------------------------------------------------------------
// [Version]
// 1.01 2017/02/06 HP/MPが初期化されなかったのを修正
// 1.00 2016/12/22 公開
//=============================================================================

/*:
 * @plugindesc 敵キャラにレベルを設定します。
 * 装備品なども設定可能です。EnemyBook非対応
 * @author ぶちょー
 *
 * @param Name
 * @desc 名前の表記方法です。
 * %1:名前　%2:レベル
 * @default %1 Lv %2
 *
 * @param AddLetter
 * @desc 名前が重複したエネミーに A,B,...,Z を付けるかどうか。
 * 付ける:true　付けない:false
 * @default false
 *
 * @help
 * 敵キャラにレベルを実装します。
 *
 * 【エネミーの設定】
 * 以下、メモ欄に記述します。
 * <EnemyLevel>
 * 各パラメータの設定
 * </EnemyLevel>
 * パラメータの設定には、変数とランダム数を用いることができます。
 * 変数 : v[id]
 * ランダム数 : random(min, max) : min から max までの数値
 * ・レベル
 *    level:レベル   （例）level:v[1] + random(1,2) : 変数[1] + 1～2
 * ・パラメータ
 *    key:数値       （例）atk:10 + level * 2
 *                   key : mhp, mmp, atk, def, mat, mdf, agi, luk
 * 　※ メモ欄で記述しなかったパラメータはデータベースの値になります。
 *
 * ・経験値
 *    exp:経験値     （例）exp:10 + level * 5
 * ・所持金
 *    gold:所持金    （例）gold:5 + level * 3
 * ・スキル
 *    requireLevel:ID,level : IDのスキルはlevel以上でないと使えない。
 *   （例）requireLevel:8,5  : ID8のスキルはレベル5以上でないと使えない。
 * ・武器
 *    weapon:ID,ID,.. ：いくつでも設定できます。数値のみ対応。 NG:v[10]
 * ・防具
 *    armor:ID,ID,..  ：いくつでも設定できます。数値のみ対応。
 * ・ドロップアイテム（複数設定可）
 *    drop:識別子+ID,確率,条件     識別子：アイテム I , 武器 W , 防具 A
 *    （例）I5,3,level>=3
 *                  レベルが3以上のとき、アイテムID5を3分の1の確率でドロップ。
 *    （例）W5,50,v[10]>=5
 *                  変数[10]が5以上のとき、武器ID5を50分の1の確率でドロップ。
 * ※ データベースで設定したもの＋メモ欄で設定したものをドロップします。
 *
 * 【例】
 * <EnemyLevel>
 * level:v[1] + random(-1,1)
 * mhp:100 + level * 20
 * mmp:10 + level * 5
 * atk:10 + level * 2
 * def:10 + level * 2
 * mat:10 + level * 2
 * mdf:10 + level * 2
 * agi:10 + level * 2
 * luk:10 + level * 2
 * exp:10 + level * 5
 * gold:5 + level * 3
 * skillRequire:8,5
 * weapon:1,1
 * armor:1,2,3,4
 * drop:I5,3,level>=3
 * drop:W5,50,v[10]>=5
 * </EnemyLevel>
 */

(function() {
  var parameters = PluginManager.parameters('KZR_EnemyLevel2');
  var EL_Name = String(parameters['Name'] || '%1 Lv %2');
  var EL_Letter = eval(parameters['AddLetter'] || 'false');

//-----------------------------------------------------------------------------
// Game_Enemy
//
var _kzr_enemy_level_Game_Enemy_setup = Game_Enemy.prototype.setup;
Game_Enemy.prototype.setup = function(enemyId, x, y) {
    _kzr_enemy_level_Game_Enemy_setup.call(this, enemyId, x, y);
    this.setLevel(enemyId, 0);
    this.recoverAll();
};

Game_Enemy.prototype.setLevel = function(enemyId, level) {
    this._level = level;
    this._ELparams = [];
    for (var i = 0; i < 8; i++) this._ELparams[i] = $dataEnemies[enemyId].params[i];
    var levelFlag = false;
    var notedata = $dataEnemies[enemyId].note.split(/[\r\n]+/);
    var note1 = /(?:(\S+):(.*))/i;
    var note2 = /(?:skillRequire:(\d+),(\d+))/i;
    var note3 = /(?:drop:([IWA])(\d+),(\d+),(.*))/i;
    for (var i = 0; i < notedata.length; i++) {
      if (levelFlag) {
        if (notedata[i].match(note1)) {
          key = RegExp.$1;
          switch (key) {
            case 'level' : if (this._level === 0) this._level = this.ELgetValue(RegExp.$2); break;
            case 'exp'   : this._exp = this.ELgetValue(RegExp.$2); break;
            case 'gold'  : this._gold = this.ELgetValue(RegExp.$2); break;
            case 'weapon': var weapons = JSON.parse('[' + RegExp.$2.match(/\d+/g) + ']'); break;
            case 'armor' : var armors  = JSON.parse('[' + RegExp.$2.match(/\d+/g) + ']'); break;
            default:
            var index = ['mhp','mmp','atk','def','mat','mdf','agi','luk'].indexOf(key);
            if (index >= 0) this._ELparams[index] = this.ELgetValue(RegExp.$2);
          }
        }
        if (notedata[i].match(note2)) {
          this._skills = this._skills || {};
          this._skills[parseInt(RegExp.$1)] = parseInt(RegExp.$2);
        }
        if (notedata[i].match(note3)) {
          this._dropItems = this._dropItems || [];
          var di = {}
          switch (RegExp.$1) {
            case 'I': di.kind = 1; break;
            case 'W': di.kind = 2; break;
            case 'A': di.kind = 3; break;
          }
          di.dataId = parseInt(RegExp.$2);
          di.denominator = parseInt(RegExp.$3);
          if (this.ELgetValue(RegExp.$4)) this._dropItems.push(di);
        }
        if (notedata[i].match(/<(?:\/EnemyLevel)>/)) levelFlag = false;
      } else {
        if (notedata[i].match(/<(?:EnemyLevel)>/)) levelFlag = true;
      }
    }
    if (this._level >= 1) {
        this._equips = [];
        if (weapons) {
            weapons.forEach(function(itemId) {
                item = new Game_Item();
                item.setEquip(true, itemId);
                this._equips.push(item);
            }, this);
        }
        if (armors) {
            armors.forEach(function(itemId) {
                item = new Game_Item();
                item.setEquip(false, itemId);
                this._equips.push(item);
            }, this);
        }
    }
};

Game_Enemy.prototype.ELgetValue = function(formula) {
    formula = formula.replace(/level/g, 'this._level');
    formula = formula.replace(/v\[(\d+)\]/gi, function() {
        return $gameVariables.value(parseInt(arguments[1]));
    }.bind(this));
    formula = formula.replace(/random\((-)?(\d+),(-)?(\d+)\)/gi, function() {
        var min = parseInt(arguments[2]);
        if (arguments[1]) min *= -1;
        var max = parseInt(arguments[4]);
        if (arguments[3]) max *= -1;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }.bind(this));
    return eval(formula);
};

Game_Enemy.prototype.equips = function() {
    return this._equips.map(function(item) {
        return item.object();
    });
};

Game_Enemy.prototype.weapons = function() {
    return this.equips().filter(function(item) {
        return item && DataManager.isWeapon(item);
    });
};

Game_Enemy.prototype.armors = function() {
    return this.equips().filter(function(item) {
        return item && DataManager.isArmor(item);
    });
};

var _kzr_enemy_level_Game_Enemy_traitObjects = Game_Enemy.prototype.traitObjects;
Game_Enemy.prototype.traitObjects = function() {
  var objects = _kzr_enemy_level_Game_Enemy_traitObjects.call(this);
  if (this._level >= 1) {
      this.equips().forEach(function(item) {
          if (item) objects.push(item);
      });
  }
  return objects;
};

var _kzr_enemy_level_Game_Enemy_paramBase = Game_Enemy.prototype.paramBase;
Game_Enemy.prototype.paramBase = function(paramId) {
    if (this._level >= 1) {
        return this._ELparams[paramId];
    } else {
        return _kzr_enemy_level_Game_Enemy_paramBase.call(this, paramId);
    }
};

Game_Enemy.prototype.paramPlus = function(paramId) {
    var value = Game_Battler.prototype.paramPlus.call(this, paramId);
    if (this._level >= 1) {
        this.equips().forEach(function(item) {
            if (item) value += item.params[paramId];
        });
    }
    return value;
};

Game_Enemy.prototype.levelUp = function() {
    this._level++;
    this.setLevel(this._enemyId, this._level);
};

Game_Enemy.prototype.levelDown = function() {
    this._level = Math.max(this._level--, 1);
    this.setLevel(this._enemyId, this._level);
};

var _kzr_enemy_level_Game_Enemy_exp = Game_Enemy.prototype.exp;
Game_Enemy.prototype.exp = function() {
    if (this._level >= 1) {
        return this._exp;
    } else {
        return _kzr_enemy_level_Game_Enemy_exp.call(this);
    }
};

var _kzr_enemy_level_Game_Enemy_gold = Game_Enemy.prototype.gold;
Game_Enemy.prototype.gold = function() {
  if (this._level >= 1) {
      return this._gold;
  } else {
      return _kzr_enemy_level_Game_Enemy_gold.call(this);
  }
};

var _kzr_enemy_level_Game_Enemy_makeDropItems = Game_Enemy.prototype.makeDropItems;
Game_Enemy.prototype.makeDropItems = function() {
    var result = _kzr_enemy_level_Game_Enemy_makeDropItems.call(this);
    return result.concat(this._dropItems.reduce(function(r, di) {
        if (di.kind > 0 && Math.random() * di.denominator < this.dropItemRate()) {
            return r.concat(this.itemObject(di.kind, di.dataId));
        } else {
            return r;
        }
    }.bind(this), []));
};

var _kzr_enemy_level_Game_Enemy_name = Game_Enemy.prototype.name;
Game_Enemy.prototype.name = function() {
    var name = _kzr_enemy_level_Game_Enemy_name.call(this);
    if (this._level >= 1) {
        if (EL_Letter) {
            return EL_Name.format(name, this._level);
        } else {
            return EL_Name.format(this.originalName(), this._level);
        }
    } else {
        return name;
    }
};

var _kzr_enemy_level_Game_Enemy_transform = Game_Enemy.prototype.transform;
Game_Enemy.prototype.transform = function(enemyId) {
    if (this._enemyId != enemyId) this.setLevel(enemyId, 0);
    _kzr_enemy_level_Game_Enemy_transform.call(this, enemyId);
};

var _kzr_enemy_level_Game_Enemy_meetsCondition = Game_Enemy.prototype.meetsCondition;
Game_Enemy.prototype.meetsCondition = function(action) {
    condition = _kzr_enemy_level_Game_Enemy_meetsCondition(this, action);
    if (!condition) return false;
    if (this._level >= 1) {
        var require = this._skills[action.skillId];
        if (require !== undefined) return this._level >= require;
    }
    return true;
};

})();
