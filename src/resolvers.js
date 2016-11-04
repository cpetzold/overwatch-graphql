import _ from 'lodash'
import ms from 'ms'
import XRay from 'x-ray'
import cached from 'cached'

const cache = cached('users', { backend: 'memory', expire: 60 * 60 })

const categories = {
  '0x0860000000000021': 'timePlayed',
  '0x0860000000000039': 'gamesWon',
  '0x08600000000003D1': 'winPercentage',
  '0x086000000000002F': 'weaponAccuracy',
  '0x08600000000003D2': 'eliminationsPerLife',
  '0x0860000000000346': 'bestMultiKill',
  '0x086000000000039C': 'averageObjectiveKills'
}

function getUser({ battletag, platform = 'pc', region = 'us' }) {
  const x = XRay({
    filters: {
      category: (val) => categories[val.replace('overwatch.guid.', '')]
    }
  })

  return new Promise((resolve, reject) => {
    x(`https://playoverwatch.com/en-us/career/${platform}/${region}/${battletag}`, {
      name: '.header-masthead',
      portrait: '.player-portrait@src',
      rank: '.competitive-rank div',
      rankImage: '.competitive-rank img@src',
      competitiveHeroStats: x('#competitive-play .progress-category', [{
        category: '@data-category-id | category',
        heroValues: x('.progress-category-item', [{
          name: '.title',
          value: '.description',
          portrait: 'img@src',
        }])
      }])
    })((err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

export default {
  Query: {
    async user(root, { battletag, platform, region }) {
      const cachedUser = await cache.get(battletag)

      if (cachedUser) {
        return cachedUser
      } else {
        const user = getUser({ battletag, platform, region })
        cache.set(battletag, user)
        return user
      }
    },
  },

  Stats: {
    minutesPlayed: ({ timePlayed }) => ms(timePlayed) / 60000,
    winPercentage: ({ winPercentage }) => parseInt(winPercentage),
    weaponAccuracy: ({ weaponAccuracy }) => parseInt(weaponAccuracy),
  },

  Hero: {
    competitiveStats: (stats) => stats
  },

  User: {
    heroes({ competitiveHeroStats }) {
      const heroStats = _.reduce(competitiveHeroStats, (result, { category, heroValues }) => {
        _.forEach(heroValues, ({ name, value, portrait }) => {
          (result[name] || (result[name] = { name, portrait }))[category] = value
        })

        return result
      }, {})

      return _.values(heroStats)
    }
  }
}
