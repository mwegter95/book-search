const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({
                    _id: context.user._id
                })
                    .select('-__v -password')
                    .populate('username')
                    .populate('bookCount')
                    .populate('savedBooks')
                    .populate('email')
                return userData;
            }

            throw new AuthenticationError('Not logged in');
        }

    },
    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            

            return { token, user };
        },
        login: async (parent, { email, password } ) => {
            console.log(email, password);
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (parent, args, context) => {
            if (context.user) {
                const userToSaveBookTo = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { bookToSave: args.input } },
                    { new: true }
                );

                return userToSaveBookTo;
            }

            throw new AuthenticationError('You need to be logged in!')
        },
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) { 
                const userToRemoveTheBookFrom = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } } },
                    { new: true }
                ).populate("savedBooks");
                 
                return userToRemoveTheBookFrom;
            }

            throw new AuthenticationError('You need to be logged in');
        }
    }
};

module.exports = resolvers;