import { FastifyInstance } from 'fastify';
import { recommendFriends, recommendFriendsSchema } from '../controllers/recommendations/friends';
import { recommedGroups, recommedGroupsSchema } from '../controllers/recommendations/groups';

export default function (fastify: FastifyInstance, opts: any, done: Function) {
  fastify.post('/friends', { schema: { body: recommendFriendsSchema } }, recommendFriends);
  fastify.post('/groups', { schema: { body: recommedGroupsSchema } }, recommedGroups);

  done();
}